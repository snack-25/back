import { Type } from 'class-transformer';
import { IsArray, IsNumber, IsString, ValidateNested } from 'class-validator';

export class OrderItemDto {
  @IsString()
  public productId: string;

  @IsNumber()
  public quantity: number;
}

export class OrderRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  public items: OrderItemDto[];
}
