import { Injectable, NotFoundException } from '@nestjs/common';
import { Product } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { ProductResponseDto } from './dto/product.response.dto';
import { ProductQueryDto } from './dto/product.query.dto';
import { PaginatedProductsResponseDto } from './dto/paginated-products.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { CreateProductDto } from './dto/create-product.dto';

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
    const [field, order] = sort.split(':');
    const where = {
      ...(search && {
        name: {
          contains: search,
        },
      }),
      ...(categoryId && { categoryId }),
    };

    const [products, total] = await Promise.all([
      this.prismaService.product.findMany({
        where,
        orderBy: {
          [field]: order as 'asc' | 'desc',
        },
        skip: (page - 1) * limit,
        take: limit,
      }),
      this.prismaService.product.count({ where }),
    ]);

    const totalPages = Math.ceil(total / limit);

    return {
      items: products.map(product => this.toResponseDto(product)),
      total,
      page,
      limit,
      totalPages,
    };
  }

  public async findOne(id: string): Promise<ProductResponseDto> {
    const product = await this.prismaService.product.findUnique({
      where: { id },
    });
    if (!product) {
      throw new NotFoundException(`상품 ${id}을 찾을 수 없습니다.`);
    }
    return this.toResponseDto(product);
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
