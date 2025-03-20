import { ApiProperty } from '@nestjs/swagger';
import { ProductResponseDto } from './product.response.dto';

export class PaginatedProductsResponseDto {
  @ApiProperty({
    description: '상품 목록',
    type: [ProductResponseDto],
  })
  public items: ProductResponseDto[];

  @ApiProperty({
    description: '전체 상품 수',
    example: 40,
  })
  public total: number;

  @ApiProperty({
    description: '현재 페이지',
    example: 1,
  })
  public page: number;

  @ApiProperty({
    description: '페이지당 상품 수',
    example: 8,
  })
  public limit: number;

  @ApiProperty({
    description: '전체 페이지 수',
    example: 5,
  })
  public totalPages: number;

  @ApiProperty({
    description: '다음 페이지 존재 여부',
    example: true,
  })
  public hasNextPage: boolean;

  @ApiProperty({
    description: '이전 페이지 존재 여부',
    example: true,
  })
  public hasPrevPage: boolean;
}
