import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: '상품 ID',
    example: 'cgztlfcf18nlufpq7fjtp3on',
  })
  public id: string;

  @ApiProperty({
    description: '상품명',
    example: '신라면 컵',
  })
  public name: string;

  @ApiProperty({
    description: '상품 가격',
    example: 1300,
  })
  public price: number;

  @ApiProperty({
    description: '상품 설명',
    example: '매콤한 국물이 일품인 컵라면',
  })
  public description: string;

  @ApiProperty({
    description: '카테고리 ID',
    example: 'w329r2phpcsn1emwzb4yux62',
  })
  public categoryId: string;

  @ApiProperty({
    description: '상품 이미지 URL',
    example: 'https://placehold.co/600x400?text=cup+noodle',
  })
  public imageUrl: string;
}
