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

    return {
      items: products.map(product => this.toResponseDto(product)),
      total,
      page,
      limit,
      totalPages,
      hasNextPage: page < totalPages,
      hasPrevPage: page > 1,
    };
  }

  public async findOne(id: string): Promise<ProductResponseDto> {
    try {
      const product = await this.prismaService.product.findUniqueOrThrow({
        where: { id },
      });
      return this.toResponseDto(product);
    } catch (e) {
      if (e instanceof Prisma.PrismaClientKnownRequestError && e.code === 'P2025') {
        throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
      }
      throw e;
    }
  }

  public async create(createProductDto: CreateProductDto): Promise<ProductResponseDto> {
    const product = await this.prismaService.product.create({
      data: {
        name: createProductDto.name,
        price: createProductDto.price,
        description: createProductDto.description,
        categoryId: createProductDto.categoryId,
        imageUrl: createProductDto.imageUrl,
      },
    });
    return this.toResponseDto(product);
  }

  public async delete(id: string): Promise<string> {
    try {
      await this.prismaService.product.delete({ where: { id } });
      return id;
    } catch {
      throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
    }
  }

  public async update(id: string, updateProductDto: UpdateProductDto): Promise<ProductResponseDto> {
    try {
      const product = await this.prismaService.product.update({
        where: { id },
        data: updateProductDto,
      });
      return this.toResponseDto(product);
    } catch {
      throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
    }
  }

  private toResponseDto(product: Product): ProductResponseDto {
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      description: product.description ?? '',
      categoryId: product.categoryId,
      imageUrl: product.imageUrl ?? '',
    };
  }
}
