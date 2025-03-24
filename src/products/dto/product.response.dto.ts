import { ApiProperty } from '@nestjs/swagger';

export class ProductResponseDto {
  @ApiProperty({
    description: '상품 ID',
    example: 'ikhfu0ii0jt0e4ok8chaulpt',
  })
  public id: string;

  @ApiProperty({
    description: '상품명',
    example: '캐모마일 티백 20개입',
  })
  public name: string;

  @ApiProperty({
    description: '상품 가격',
    example: 5500,
  })
  public price: number;

  @ApiProperty({
    description: '상품 설명',
  })
  public description: string;

  @ApiProperty({
    description: '카테고리 ID',
    example: 'qzdz7eebb8whwqwyc12pwv8r',
  })
  public categoryId: string;

  @ApiProperty({
    description: '상품 이미지 URL',
  })
  public imageUrl: string;

  @ApiProperty({
    description: '총 판매 수량',
  })
  public totalSold: number;
}
