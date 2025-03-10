import { Controller } from '@nestjs/common';
import { CategoriesService } from './categories.service';

@Controller('categories')
export class CategoriesController {
  public constructor(private readonly categoriesService: CategoriesService) {}

  // TODO: /categories (GET) 카테고리 목록 조회
  // TODO: /categories (POST) 카테고리 추가
  // TODO: /categories/{categoryId} (PUT/PATCH) 카테고리 수정
  // TODO: /categories/{categoryId} (DELETE) 카테고리 삭제
}
