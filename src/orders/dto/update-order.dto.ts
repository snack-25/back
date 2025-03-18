import { IsOptional, IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';
import { ApiPropertyOptional } from '@nestjs/swagger';

export class OrderQueryDto {
  @ApiPropertyOptional({
    description: '주문 상태 필터',
    enum: OrderStatus,
    example: 'PROCESSING',
  })
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'status 값이 유효하지 않습니다.' })
  public status?: OrderStatus;
}
