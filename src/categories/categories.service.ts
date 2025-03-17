import { Injectable } from '@nestjs/common';
import { Category, PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class CategoriesService {
  public async findAll(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        isActive: true,
      },
    });
    return categories;
  }

  public async getParentCategories(): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        parentId: null,
        isActive: true,
      },
    });
    return categories;
  }

  public async getSubCategories(id: string): Promise<Category[]> {
    const categories = await prisma.category.findMany({
      where: {
        parentId: id,
        isActive: true,
      },
    });
    return categories;
  }
}
