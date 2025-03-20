import { ApiProperty } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: '상품명',
    example: '허니버터칩',
  })
  public name: string;

  @ApiProperty({
    description: '상품 가격',
    example: 1500,
  })
  public price: number;

  @ApiProperty({
    description: '상품 설명',
    example: '달콤한 허니버터 맛이 일품인 과자',
    required: false,
  })
  public description?: string;

  @ApiProperty({
    description: '카테고리 ID',
    example: 'cf2pr8ygr0ouvna9nbq506je',
  })
  public categoryId: string;

  @ApiProperty({
    description: '상품 이미지 URL',
    example: 'https://placehold.co/600x400?text=honeybutter',
    required: false,
  })
  public imageUrl?: string;
}
