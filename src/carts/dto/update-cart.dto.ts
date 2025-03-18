import { ArrayNotEmpty, IsArray, IsInt, IsString, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class UpdateCartItemDto {
  @ApiProperty({
    description: '변경할 상품 수량',
    example: 31,
  })
  @IsInt({ message: '수량은 정수여야 합니다.' })
  @Min(1, { message: '수량은 최소 1 이상이어야 합니다.' })
  public quantity: number;
}

export class DeleteCartItemsDto {
  @ApiProperty({
    description: '삭제할 장바구니 상품 ID 목록',
    example: ['product_07', 'product_08'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: '삭제할 상품 목록은 비어 있을 수 없습니다.' })
  @IsString({ each: true })
  public itemIds: string[];
}
