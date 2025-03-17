import { IsOptional, IsEnum } from 'class-validator';
import { OrderStatus } from '@prisma/client';

export class OrderQueryDto {
  @IsOptional()
  @IsEnum(OrderStatus, { message: 'status 값이 유효하지 않습니다.' })
  public status?: OrderStatus;
}
