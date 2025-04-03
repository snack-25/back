import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsOptional } from 'class-validator';
import { IsCuid2 } from '@src/shared/decorators/is-cuid2.decorator';

export class RejectOrderRequestDto {
  @ApiProperty({ description: '주문 요청을 거절한 관리자 ID', example: 'tz4a98xxat96iws9zmbrgj3a' })
  @IsCuid2()
  public resolverId: string;

  @ApiProperty({
    description: '거절 메시지',
    example: '예산 부족으로 인해 거절되었습니다.',
    required: false,
  })
  @IsString()
  @IsOptional()
  public notes: string;
}
