import { Injectable, NotFoundException } from '@nestjs/common';
import { Category } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';

@Injectable()
export class CategoriesService {
  public constructor(private readonly prismaService: PrismaService) {}

  public async findAll(): Promise<Category[]> {
    const categories = await this.prismaService.category.findMany({
      where: {
        isActive: true,
      },
    });
    return categories;
  }

  public async getParentCategories(): Promise<Category[]> {
    const categories = await this.prismaService.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
    });
    if (!categories || categories.length === 0) {
      throw new NotFoundException('부모 카테고리를 찾을 수 없습니다.');
    }

    return categories;
  }

  public async getSubCategories(id: string): Promise<Category[]> {
    const categories = await this.prismaService.category.findMany({
      where: {
        parentId: id,
        isActive: true,
      },
    });
    if (!categories || categories.length === 0) {
      throw new NotFoundException('하위 카테고리가 없거나 찾을 수 없습니다.');
    }
    return categories;
  }
}
