import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class ToggleWishlistDto {
  @ApiProperty({
    description: '찜할 상품의 ID',
    example: 'product_04',
  })
  @IsString()
  public productId: string;
}
