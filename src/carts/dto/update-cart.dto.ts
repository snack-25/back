import { IsInt, Min } from 'class-validator';
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
