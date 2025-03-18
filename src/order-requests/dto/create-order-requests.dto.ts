import { ApiProperty } from '@nestjs/swagger';
import { IsUUID, IsString, IsInt, Min, IsArray, ValidateNested, IsDate } from 'class-validator';
import { Type } from 'class-transformer';
import { OrderRequestStatus } from '@prisma/client';

class OrderRequestItemDto {
  @ApiProperty({ description: '상품 ID', example: 'product-uuid-1234' })
  @IsUUID()
  productId: string;

  @ApiProperty({ description: '주문 요청 항목 수량', example: 2 })
  @IsInt()
  @Min(1)
  quantity: number;

  // 상품 가격은 DB에서 자동으로 가져오므로, DTO에 포함시키지 않아도 됨
  @ApiProperty({ description: '상품 가격', example: 10000 })
  price?: number; // 필수값이 아니라 DB에서 자동으로 채워짐

  @ApiProperty({
    description: '요청 메시지 (사용자가 입력하는 메모)',
    example: '구매 부탁드립니다.',
  })
  @IsString()
  notes?: string;
}

export class CreateOrderRequestDto {
  @ApiProperty({ description: '요청을 보낸 회사 ID', example: 'company-uuid-5678' })
  @IsUUID()
  companyId: string;

  @ApiProperty({ description: '주문 요청을 보낸 사용자 ID', example: 'user-uuid-1234' })
  @IsUUID()
  requesterId: string;

  @ApiProperty({ description: '주문 요청 생성 시간', example: '2025-03-11T12:00:00Z' })
  @IsDate()
  createdAt: Date = new Date();

  @ApiProperty({ description: '주문 요청 항목 리스트', type: [OrderRequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderRequestItemDto)
  items: OrderRequestItemDto[];

  status?: OrderRequestStatus;
}
