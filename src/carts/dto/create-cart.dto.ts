import { IsNotEmpty, IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateCartDto {
  @ApiProperty({
    description: '추가할 상품 ID',
    example: 'b9kafx2nzxk8kly3aqu10il5',
  })
  @IsNotEmpty({ message: '상품 ID는 필수입니다.' })
  @IsString({ message: '상품 ID는 문자열이어야 합니다.' })
  public productId: string;
}
