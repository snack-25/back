import { ApiProperty } from '@nestjs/swagger';
import { IsNumber, IsString } from 'class-validator';

export class CreateProductDto {
  @ApiProperty({
    description: '상품명',
    example: '허니버터칩',
  })
  @IsString()
  public name: string;

  @ApiProperty({
    description: '상품 설명',
    example: '달콤한 허니버터 맛이 일품인 과자',
    required: false,
  })
  public description?: string;

  @ApiProperty({
    description: '카테고리 ID',
    example: '',
  })
  @IsString()
  public categoryId: string;

  @ApiProperty({
    description: '상품 가격',
    example: 1000,
  })
  @IsNumber()
  public price: number;
}
