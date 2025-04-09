import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { ProductResponseDto } from './dto/product.response.dto';
import { MyProductQueryDto, ProductQueryDto } from './dto/product.query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { OrderStatus } from '@src/orders/enums/order-status.enum';
import { extname } from 'path';
import { createId } from '@paralleldrive/cuid2';
import { DeleteObjectCommand, PutObjectCommand, S3Client } from '@aws-sdk/client-s3';
import { ALLOWED_MIME_TYPES, FILE_SIZE_LIMIT } from './const';
import { UserDto } from '@src/users/dto/user.dto';
import { UserRole } from '@src/users/enums/role.enum';

@Injectable()
export class ProductsService {
  public constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(ProductsService.name);

  private readonly s3Client = new S3Client({
    region:
      process.env.AWS_S3_REGION ||
      (() => {
        throw new InternalServerErrorException('AWS_S3_REGION environment variable is not defined');
      })(),
  });

  private readonly COUNTED_ORDER_STATUS = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.COMPLETED,
  ];

  private getS3ImgUrl(filename: string): string {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_S3_REGION;

    if (!bucketName || !region) {
      throw new InternalServerErrorException(
        'AWS_S3_BUCKET_NAME or AWS_S3_REGION environment variable is not defined',
      );
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/products/${filename}`;
  }

  public async getProductsByUserId({ page, limit, sort, userId }: MyProductQueryDto): Promise<{
    items: any;
    total: any;
    page: number;
    limit: number;
    totalPages: number;
    hasNextPage: boolean;
    hasPrevPage: boolean;
  }> {
    const splitSort = sort.split(':');

    if (splitSort.length !== 2) {
      throw new BadRequestException('Invalid sort format');
    }
    const [field, order] = splitSort;
    const where = {
      createdById: userId,
    };

    const total = await this.prismaService.product.count({ where });

    const totalPages = Math.ceil(total / limit);

    const products = await this.prismaService.product.findMany({
      where,
      orderBy: {
        [field]: order as 'asc' | 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    return {
      items: products,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  public async findAllProducts({
    page,
    limit,
    search,
    categoryId,
    sort,
  }: ProductQueryDto): Promise<PaginatedProductsResponseDto> {
    const splitSort = sort.split(':');
    if (splitSort.length !== 2) {
      throw new BadRequestException('Invalid sort format');
    }
    const [field, order] = splitSort;
    const where = {
      ...(search && {
        name: {
          contains: search,
        },
      }),
      ...(categoryId && { categoryId }),
    };

    const total = await this.prismaService.product.count({ where });
    const totalPages = Math.ceil(total / limit);

    const products = await this.prismaService.product.findMany({
      where,
      orderBy: {
        [field]: order as 'asc' | 'desc',
      },
      skip: (page - 1) * limit,
      take: limit,
    });

    const productSales = await this.prismaService.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          status: {
            in: this.COUNTED_ORDER_STATUS,
          },
        },
      },
      _sum: {
        quantity: true,
      },
    });

    const enrichedProducts = products.map(product => {
      const sales = productSales.find(sale => sale.productId === product.id);
      return {
        ...this.toResponseDto(product),
        totalSold: sales?._sum.quantity || 0,
      };
    });

    return {
      items: enrichedProducts,
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  public async findOneProduct(id: string): Promise<ProductResponseDto> {
    try {
      const totalSold = await this.prismaService.orderItem.aggregate({
        where: {
          productId: id,
          order: {
            status: {
              in: this.COUNTED_ORDER_STATUS,
            },
          },
        },
        _sum: {
          quantity: true,
        },
      });
      const product = await this.prismaService.product.findUniqueOrThrow({
        where: { id },
      });
      return {
        ...this.toResponseDto(product),
        totalSold: totalSold._sum.quantity || 0,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
      }
      throw e;
    }
  }

  public async createProduct(
    user: UserDto,
    createProductDto: CreateProductDto,
    file: Express.Multer.File | undefined,
  ): Promise<ProductResponseDto> {
    const isFileExist = !!file; // 업로드한 파일이 있는지 확인
    let isImgUploaded = false; // 이미지가 s3 버킷에 업로드 성공했는지 확인
    let filename = '';

    // 업로드할 이미지 파일이 있을 경우에만 s3 업로드 로직 실행
    if (isFileExist) {
      filename = `${createId()}${extname(file.originalname).toLowerCase()}`;

      const uploadParams = {
        Bucket:
          process.env.AWS_S3_BUCKET_NAME ||
          (() => {
            throw new InternalServerErrorException(
              'AWS_S3_BUCKET_NAME environment variable is not defined',
            );
          })(),
        Key: `products/${filename}`,
        Body: file.buffer,
        ContentType: file.mimetype,
      };

      if (!ALLOWED_MIME_TYPES.includes(file.mimetype)) {
        throw new BadRequestException(
          '지원되지 않는 파일 형식입니다. JPEG, PNG, GIF, WEBP 형식만 지원합니다.',
        );
      }

      if (file.size > FILE_SIZE_LIMIT) {
        throw new BadRequestException('파일 크기가 너무 큽니다. 최대 5MB까지 업로드 가능합니다.');
      }

      try {
        const command = new PutObjectCommand(uploadParams);
        await this.s3Client.send(command);
        isImgUploaded = true;
      } catch (e) {
        this.logger.error(e);
        throw new BadRequestException('파일 업로드에 실패했습니다.');
      }
    }

    try {
      const product = await this.prismaService.$transaction(async tx => {
        return tx.product.create({
          data: {
            createdById: user.id,
            name: createProductDto.name,
            description: createProductDto.description,
            categoryId: createProductDto.categoryId,
            price: createProductDto.price,
            imageUrl: isImgUploaded ? this.getS3ImgUrl(filename) : null,
          },
        });
      });
      return this.toResponseDto(product);
    } catch (error) {
      if (isImgUploaded) {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `products/${filename}`,
          }),
        );
      }
      this.logger.error(error);
      throw new BadRequestException('상품 생성에 실패했습니다.');
    }
  }

  public async deleteProduct(id: string, user: UserDto): Promise<string> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!product) {
      throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
    }

    if (user.role === UserRole.SUPERADMIN || product.createdById === user.id) {
      try {
        if (product.imageUrl) {
          await this.s3Client.send(
            new DeleteObjectCommand({
              Bucket: process.env.AWS_S3_BUCKET_NAME,
              Key: `products/${product.imageUrl.split('/').pop()}`,
            }),
          );
        }

        await this.prismaService.product.delete({
          where: { id },
        });

        return `상품 ${id} 삭제 성공`;
      } catch (e) {
        this.logger.error(e);
        throw new InternalServerErrorException('상품 삭제 중 서버 오류가 발생했습니다.');
      }
    } else {
      throw new UnauthorizedException('최고관리자 또는 본인이 등록한 상품만 삭제할 수 있습니다. ');
    }
  }

  public async updateProduct(
    user: UserDto,
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    const target = await this.prismaService.product.findUnique({
      where: { id },
    });

    if (!target) {
      throw new NotFoundException('존재하지 않는 상품입니다');
    }

    if (user.role === UserRole.SUPERADMIN || target.createdById === user.id) {
      const product = await this.prismaService.$transaction(async tx => {
        return tx.product.update({
          where: { id },
          data: {
            name: updateProductDto.name,
            price: updateProductDto.price,
            description: updateProductDto.description,
            // imageUrl: updateProductDto.imageUrl,
            categoryId: updateProductDto.categoryId,
            updatedById: user.id,
          },
        });
      });
      return this.toResponseDto(product);
    }

    throw new UnauthorizedException('최고관리자 또는 본인이 등록한 상품만 수정 가능합니다.');
  }

  public async getProductPricesByIds(productIds: string[]): Promise<Map<string, number>> {
    const products = await this.prismaService.product.findMany({
      where: { id: { in: productIds } },
      select: { id: true, price: true },
    });

    return new Map(products.map(p => [p.id, p.price]));
  }

  private toResponseDto(product: Product): ProductResponseDto {
    return {
      createdAt: product.createdAt,
      createdById: product.createdById,
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description ?? '',
      categoryId: product.categoryId,
      imageUrl: product.imageUrl ?? '',
      totalSold: 0,
    };
  }
}
