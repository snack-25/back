import { IsArray, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleWishlistDto {
  @ApiProperty({
    description: '찜할 상품의 ID',
    example: 'b9kafx2nzxk8kly3aqu10il5',
  })
  @IsString()
  public productId: string;
}

export class MoveToCartDto {
  @ApiProperty({
    example: ['b9kafx2nzxk8kly3aqu10il5'],
    description: '찜에서 장바구니로 이동할 상품 ID 배열',
  })
  @IsArray()
  @IsString({ each: true })
  public productIds: string[];
}
