import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class OrderItemDto {
  @ApiProperty({ description: '상품 ID', example: 'product-uuid-1234' })
  @IsString()
  public productId: string;

  @ApiProperty({ description: '상품 수량', example: 2 })
  @IsNumber()
  public quantity: number;
}

export class OrderRequestDto {
  @ApiProperty({
    description: '주문할 상품 목록',
    type: [OrderItemDto],
    example: [
      { productId: 'product_08', quantity: 2 },
      { productId: 'product_01', quantity: 1 },
    ],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  public items: OrderItemDto[];
}
