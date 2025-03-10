import { Controller } from '@nestjs/common';
import { OrdersService } from './orders.service';

@Controller('orders')
export class OrdersController {
  public constructor(private readonly ordersService: OrdersService) {}

  //TODO: /orders (GET) 주문 목록 조회
  //TODO: /orders (POST) 주문 생성
  //TODO: /orders/{orderId} (GET) 주문 상세 조회
}
