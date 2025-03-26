// dto/get-order-requests.dto.ts
import { ApiProperty } from '@nestjs/swagger';
import { IsEnum, IsInt, IsOptional, Max, Min } from 'class-validator';
import { Type } from 'class-transformer';

export enum OrderSort {
  LATEST = 'latest',
  LOW_PRICE = 'lowPrice',
  HIGH_PRICE = 'highPrice',
}

export class GetOrderRequestsDto {
  @ApiProperty({
    required: false,
    type: Number,
    example: 1,
    description: '페이지 번호',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Type(() => Number)
  page?: number = 1;

  @ApiProperty({
    required: false,
    type: Number,
    example: 6,
    description: '페이지당 항목 개수',
  })
  @IsOptional()
  @IsInt()
  @Min(1)
  @Max(50)
  @Type(() => Number)
  pageSize?: number = 10;

  @ApiProperty({
    required: false,
    enum: OrderSort,
    example: OrderSort.LATEST,
    description: '정렬 기준 (latest: 최신순, lowPrice: 낮은 가격순, highPrice: 높은 가격순)',
  })
  @IsOptional()
  @IsEnum(OrderSort)
  sort?: OrderSort = OrderSort.LATEST;
}
