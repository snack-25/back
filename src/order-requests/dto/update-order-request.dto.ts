import { PartialType } from '@nestjs/swagger';
import { CreateOrderRequestDto } from './create-order-requests.dto';

export class UpdateOrderRequestDto extends PartialType(CreateOrderRequestDto) {}
