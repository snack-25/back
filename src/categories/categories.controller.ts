import { Controller, Get, Param } from '@nestjs/common';
import { CategoriesService } from './categories.service';
import { Category } from '@prisma/client';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { CategoryResponseDto } from './dto/category.response.dto';
import { ApiBearerAuth } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('categories')
export class CategoriesController {
  public constructor(private readonly categoriesService: CategoriesService) {}

  // TODO: /categories (GET) 카테고리 목록 조회
  @Get('/all')
  @ApiOperation({ summary: '모든 카테고리 조회' })
  @ApiResponse({ status: 200, description: '카테고리 목록', type: [CategoryResponseDto] })
  public findAll(): Promise<Category[]> {
    return this.categoriesService.findAll();
  }

  @Get('/parents')
  @ApiOperation({ summary: '부모 카테고리 목록 조회' })
  @ApiResponse({ status: 200, description: '부모 카테고리 목록', type: [CategoryResponseDto] })
  public getParentCategories(): Promise<Category[]> {
    return this.categoriesService.getParentCategories();
  }

  @Get('/parents/:id')
  @ApiOperation({ summary: '하위 카테고리 목록 조회' })
  @ApiResponse({ status: 200, description: '하위 카테고리 목록', type: [CategoryResponseDto] })
  public getSubCategories(@Param('id') id: string): Promise<Category[]> {
    return this.categoriesService.getSubCategories(id);
  }

  // TODO: /categories (POST) 카테고리 추가
  // TODO: /categories/{categoryId} (PUT/PATCH) 카테고리 수정
  // TODO: /categories/{categoryId} (DELETE) 카테고리 삭제
}
