import { ApiPropertyOptional } from '@nestjs/swagger';

export class ProductQueryDto {
  @ApiPropertyOptional({
    description: '페이지 번호',
    example: 1,
    default: 1,
  })
  public page: number;

  @ApiPropertyOptional({
    description: '페이지당 상품 수',
    example: 10,
    default: 10,
  })
  public limit: number;

  @ApiPropertyOptional({
    description: '검색어 (상품명)',
    example: '허니버터',
  })
  public search: string;

  @ApiPropertyOptional({
    description: '카테고리 ID',
    example: 'sub-과자',
  })
  public categoryId: string;

  @ApiPropertyOptional({
    description: '정렬 순서 (생성일 기준)',
    example: 'desc',
    enum: ['asc', 'desc'],
    default: 'desc',
  })
  public sort: string;
}
