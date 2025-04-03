import { IsCuid2 } from '@src/shared/decorators/is-cuid2.decorator';
import { ApiProperty } from '@nestjs/swagger';
import { OrderRequestStatus } from '@prisma/client';
import { Type } from 'class-transformer';
import { IsArray, IsInt, IsString, IsEnum, Min, ValidateNested } from 'class-validator';

class OrderRequestItemDto {
  @ApiProperty({ description: '상품 ID', example: 'tz4a98xxat96iws9zmbrgj3a' })
  @IsCuid2()
  public productId: string;

  @ApiProperty({ description: '주문 요청 항목 수량', example: 2 })
  @IsInt()
  @Min(1)
  public quantity: number;

  @ApiProperty({
    description: '요청 메시지 (사용자가 입력하는 메모)',
    example: '구매 부탁드립니다.',
  })
  @IsString()
  public notes?: string;
}

export class CreateOrderRequestDto {
  @ApiProperty({ description: '요청을 보낸 회사 ID', example: 'pfh0haxfpzowht3oi213cqos' })
  @IsCuid2()
  public companyId: string;

  @ApiProperty({ description: '주문 요청을 보낸 사용자 ID', example: 'nc6bzmkmd014706rfda898to' })
  @IsCuid2()
  public requesterId: string;

  @ApiProperty({ description: '주문 요청 항목 리스트', type: [OrderRequestItemDto] })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderRequestItemDto)
  public items: OrderRequestItemDto[];

  @ApiProperty({ description: '주문 요청 상태', example: 'PENDING' })
  @IsEnum(OrderRequestStatus)
  public status: OrderRequestStatus;
}
