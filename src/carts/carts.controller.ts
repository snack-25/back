import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { CreateCartDto } from './dto/create-cart.dto';
import { CartsService } from './carts.service';
import { DeleteCartItemsDto, UpdateCartItemDto } from './dto/update-cart.dto';
import { CartItem } from '@prisma/client';
import { ApiOperation, ApiParam, ApiResponse } from '@nestjs/swagger';

@Controller('carts')
export class CartsController {
  public constructor(private readonly cartsService: CartsService) {}

  // TODO: /carts/{cartId}/items (GET) 장바구니 항목 조회
  @Get(':cartId/items')
  public async getCartItems(@Param('cartId') cartId: string): Promise<CartItem[]> {
    return await this.cartsService.getCartItems(cartId);
  }

  // TODO: /carts/{cartId}/items (POST) 장바구니 항목 추가
  @Post(':cartId/items')
  public async addToCart(
    @Param('cartId') cartId: string,
    @Body() createDto: CreateCartDto,
  ): Promise<CartItem> {
    return await this.cartsService.addToCart(cartId, createDto.productId);
  }

  // TODO: /carts/{cartId}/items/{itemId} (PUT/PATCH) 장바구니 항목 수정
  @Patch(':cartId/items/:itemId')
  public async updateCartItem(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItem> {
    return await this.cartsService.updateCartItem(cartId, itemId, updateCartItemDto.quantity);
  }
  // TODO: /carts/{cartId}/items (DELETE) 장바구니 항목 삭제
  @Delete(':cartId/items')
  public async removeCartItems(
    @Param('cartId') cartId: string,
    @Body() deleteDto: DeleteCartItemsDto,
  ): Promise<{ message: string }> {
    return await this.cartsService.deleteCartItems(cartId, deleteDto.itemIds);
  }
}
