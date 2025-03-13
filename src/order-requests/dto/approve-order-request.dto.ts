import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsDate } from 'class-validator';

export class ApproveOrderRequestDto{
  @ApiProperty({ description: '주문 요청을 승인한 관리자 ID', example: 'admin-uuid-5678' })
  @IsUUID()
  resolverId: string;

  @ApiProperty({ description: '승인 메시지', example: '요청이 승인되었습니다.' })
  @IsString()
  notes: string;

  @ApiProperty({ description: '주문 요청 승인 시각', example: '2025-03-12T15:30:00Z' })
  @IsDate()
  resolvedAt: Date = new Date();
}
