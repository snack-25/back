import {
  BadRequestException,
  Injectable,
  NotFoundException,
  Logger,
  InternalServerErrorException,
} from '@nestjs/common';
import { Prisma, Product } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { ProductResponseDto } from './dto/product.response.dto';
import { ProductQueryDto } from './dto/product.query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { OrderStatus } from '@src/orders/enums/order-status.enum';
import { extname } from 'path';
import { createId } from '@paralleldrive/cuid2';
import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { FILE_SIZE_LIMIT, ALLOWED_MIME_TYPES } from './const';

@Injectable()
export class ProductsService {
  public constructor(private readonly prismaService: PrismaService) {}

  private readonly logger = new Logger(ProductsService.name);

  private readonly s3Client = new S3Client({
    region:
      process.env.AWS_REGION ||
      (() => {
        throw new InternalServerErrorException('AWS_REGION environment variable is not defined');
      })(),
  });

  private readonly COUNTED_ORDER_STATUS = [
    OrderStatus.PENDING,
    OrderStatus.PROCESSING,
    OrderStatus.COMPLETED,
  ];

  private getS3ImgUrl(filename: string): string {
    const bucketName = process.env.AWS_S3_BUCKET_NAME;
    const region = process.env.AWS_REGION;

    if (!bucketName || !region) {
      throw new InternalServerErrorException(
        'AWS_S3_BUCKET_NAME or AWS_REGION environment variable is not defined',
      );
    }
    return `https://${bucketName}.s3.${region}.amazonaws.com/products/${filename}`;
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
    createProductDto: CreateProductDto,
    file: Express.Multer.File,
  ): Promise<ProductResponseDto> {
    // TODO: 실패시 로직, 예외 처리, 커스텀 데코레이터로 생성한 유저 정보 추가 필요함(2025-03-31 19:40)
    const filename = `${createId()}${extname(file.originalname).toLowerCase()}`;

    this.logger.debug(`파일 업로드 시작: ${filename}`);

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
    this.logger.debug('파일 업로드 시작');

    let isImgUploaded = false;
    try {
      const command = new PutObjectCommand(uploadParams);
      await this.s3Client.send(command);
      isImgUploaded = true;
      this.logger.debug('파일 업로드 성공');
    } catch (e) {
      this.logger.error(e);
      throw new BadRequestException('파일 업로드에 실패했습니다.');
    }
    try {
      const product = await this.prismaService.$transaction(async tx => {
        return tx.product.create({
          data: {
            name: createProductDto.name,
            description: createProductDto.description,
            categoryId: createProductDto.categoryId,
            price: createProductDto.price,
            imageUrl: this.getS3ImgUrl(filename),
          },
        });
      });
      return this.toResponseDto(product);
    } catch (error) {
      if (isImgUploaded) {
        await this.s3Client.send(new DeleteObjectCommand(uploadParams));
      }
      this.logger.error(error);
      throw new BadRequestException('상품 생성에 실패했습니다.');
    }
  }

  public async deleteProduct(id: string): Promise<string> {
    try {
      const product = await this.prismaService.product.findUnique({
        where: { id },
      });

      if (!product) {
        throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
      }

      if (product.imageUrl) {
        await this.s3Client.send(
          new DeleteObjectCommand({
            Bucket: process.env.AWS_S3_BUCKET_NAME,
            Key: `products/${product.imageUrl.split('/').pop()}`,
          }),
        );
      }
      await this.prismaService.$transaction(async tx => {
        await tx.product.delete({
          where: { id },
        });
      });

      return `상품 ${id}를 성공적으로 삭제했습니다.`;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
      }
      throw e;
    }
  }

  public async updateProduct(
    id: string,
    updateProductDto: UpdateProductDto,
  ): Promise<ProductResponseDto> {
    // TODO: 이미지 업데이트 로직 추가(s3에서 기존 이미지 삭제처리 필요) 2025-04-01 12:39
    const product = await this.prismaService.$transaction(async tx => {
      return tx.product.update({
        where: { id },
        data: {
          name: updateProductDto.name,
          price: updateProductDto.price,
          description: updateProductDto.description,
          // imageUrl: updateProductDto.imageUrl,
          categoryId: updateProductDto.categoryId,
        },
      });
    });
    return this.toResponseDto(product);
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
