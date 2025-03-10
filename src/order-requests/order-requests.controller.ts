import { Controller } from '@nestjs/common';
import { OrderRequestsService } from './order-requests.service';

@Controller('order-requests')
export class OrderRequestsController {
  public constructor(private readonly orderRequestsService: OrderRequestsService) {}

  //TODO: /order-requests (GET) 주문 요청 목록 조회
  //TODO: /order-requests (POST) 주문 요청 생성
  //TODO: /order-requests/{orderRequestId} (GET) 주문 요청 상세 조회
  //TODO: /order-requests/{orderRequestId}/accept (POST) 주문 요청 승인
  //TODO: /order-requests/{orderRequestId}/reject (POST) 주문 요청 반려
  //TODO: /order-requests/{orderRequestId} (DELETE) 주문 요청 취소
}
