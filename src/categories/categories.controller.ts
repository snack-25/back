import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from '@prisma/client';

@Controller('categories')
export class CategoriesController {
  public constructor(private readonly categoriesService: CategoriesService) {}

  // TODO: /categories (GET) 카테고리 목록 조회
  @Get('')
  public findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get('/parents')
  public getParentCategories(): Promise<Category[]> {
    return this.categoriesService.getParentCategories();
  }

  @Get('/:id')
  public getSubCategories(@Param('id') id: string): Promise<Category[]> {
    return this.categoriesService.getSubCategories(id);
  }

  // TODO: /categories (POST) 카테고리 추가
  // TODO: /categories/{categoryId} (PUT/PATCH) 카테고리 수정
  // TODO: /categories/{categoryId} (DELETE) 카테고리 삭제
}
