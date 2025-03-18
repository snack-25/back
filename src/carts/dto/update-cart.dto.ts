import { ApiProperty } from '@nestjs/swagger';
import { IsInt, Min } from 'class-validator';

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
    description: '삭제할 상품의 ID 목록',
    example: ['item-1', 'item-2'],
  })
  public itemIds: string[];
}
