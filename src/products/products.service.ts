import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { ProductResponseDto } from './dto/product.response.dto';
import { ProductQueryDto } from './dto/product.query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';
import { BadRequestException } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { OrderStatus } from '@src/orders/enums/order-status.enum';

@Injectable()
export class ProductsService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async findAll({
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
          status: OrderStatus.COMPLETED,
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
      const totalSold = await this.prismaService.orderItem.groupBy({
        by: ['productId'],
        where: {
          order: {
            status: OrderStatus.COMPLETED,
          },
        },
        _sum: {
          quantity: true,
        },
      });
      const sales = totalSold.find(sale => sale.productId === id);
      const product = await this.prismaService.product.findUniqueOrThrow({
        where: { id },
      });
      return {
        ...this.toResponseDto(product),
        totalSold: sales?._sum.quantity || 0,
      };
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
      }
      throw e;
    }
  }

  public async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.prismaService.$transaction(async tx => {
      return tx.product.create({
        data: {
          name: createProductDto.name,
          price: createProductDto.price,
          description: createProductDto.description,
          categoryId: createProductDto.categoryId,
          imageUrl: createProductDto.imageUrl,
        },
      });
    });
    return this.toResponseDto(product);
  }

  public async delete(id: string): Promise<string> {
    try {
      await this.prismaService.product.delete({
        where: { id },
      });
      return `상품 ${id}를 성공적으로 삭제했습니다.`;
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
      }
      throw e;
    }
  }

  public async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    const product = await this.prismaService.$transaction(async tx => {
      return tx.product.update({
        where: { id },
        data: {
          name: updateProductDto.name,
          price: updateProductDto.price,
          description: updateProductDto.description,
          categoryId: updateProductDto.categoryId,
          imageUrl: updateProductDto.imageUrl,
        },
      });
    });
    return this.toResponseDto(product);
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
