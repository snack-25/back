import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty, IsArray, IsInt, IsString, Min } from 'class-validator';

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
    example: ['b9kafx2nzxk8kly3aqu10il5', 'bpzjjojw9tdds3jas9nglcqp'],
  })
  @IsArray()
  @ArrayNotEmpty({ message: '삭제할 상품 목록은 비어 있을 수 없습니다.' })
  @IsString({ each: true })
  public itemIds: string[];
}
