import { Controller } from '@nestjs/common';
import { CartsService } from './carts.service';

@Controller('carts')
export class CartsController {
  public constructor(private readonly cartsService: CartsService) {}

  // TODO: /carts/{cartId}/items (GET) 장바구니 항목 조회
  // TODO: /carts/{cartId}/items (POST) 장바구니 항목 추가
  // TODO: /carts/{cartId}/items/{itemId} (PUT/PATCH) 장바구니 항목 수정
  // TODO: /carts/{cartId}/items/{itemId} (DELETE) 장바구니 항목 삭제
}
