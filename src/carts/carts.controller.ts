import { Body, Controller, Delete, Get, Param, Patch, Post } from '@nestjs/common';
import { ApiBody, ApiOperation, ApiParam, ApiResponse, ApiTags } from '@nestjs/swagger';
import { CartItem } from '@prisma/client';
import { CartsService } from './carts.service';
import { CreateCartDto } from './dto/create-cart.dto';
import { DeleteCartItemsDto, UpdateCartItemDto } from './dto/update-cart.dto';

@ApiTags('Carts')
@Controller('carts')
export class CartsController {
  public constructor(private readonly cartsService: CartsService) {}

  @ApiOperation({
    summary: '장바구니 조회',
    description: '특정 장바구니의 상품 목록을 조회합니다.',
  })
  @ApiParam({
    name: 'cartId',
    required: true,
    description: '조회할 장바구니 ID',
    example: 'rbh4ib2mt2pt5175wuf9wsz6',
  })
  @ApiResponse({ status: 200, description: '장바구니 조회 성공' })
  @Get(':cartId/items')
  public async getCartItems(@Param('cartId') cartId: string): Promise<CartItem[]> {
    return await this.cartsService.getCartItems(cartId);
  }

  @ApiOperation({
    summary: '장바구니 상품 추가',
    description: '특정 장바구니에 상품을 추가합니다.',
  })
  @ApiParam({
    name: 'cartId',
    required: true,
    description: '상품을 추가할 장바구니 ID',
    example: 'rbh4ib2mt2pt5175wuf9wsz6',
  })
  @ApiBody({
    type: CreateCartDto,
    description: '추가할 상품의 ID',
    examples: {
      example1: {
        value: { productId: 'jlvtn4vc0wkycxa9c9koa2sw' },
      },
    },
  })
  @ApiResponse({ status: 201, description: '상품 추가 성공' })
  @Post(':cartId/items')
  public async addToCart(
    @Param('cartId') cartId: string,
    @Body() createDto: CreateCartDto,
  ): Promise<CartItem> {
    return await this.cartsService.addToCart(cartId, createDto.productId);
  }

  @ApiOperation({
    summary: '장바구니 상품 수량 변경',
    description: '특정 장바구니 상품의 수량을 변경합니다.',
  })
  @ApiParam({
    name: 'cartId',
    required: true,
    description: '장바구니 ID',
    example: 'rbh4ib2mt2pt5175wuf9wsz6',
  })
  @ApiParam({
    name: 'itemId',
    required: true,
    description: '수량을 변경할 장바구니 상품 ID',
    example: 'jlvtn4vc0wkycxa9c9koa2sw',
  })
  @ApiBody({ type: UpdateCartItemDto, description: '변경할 상품 수량' })
  @ApiResponse({ status: 200, description: '상품 수량 변경 성공' })
  @Patch(':cartId/items/:itemId')
  public async updateCartItem(
    @Param('cartId') cartId: string,
    @Param('itemId') itemId: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<CartItem> {
    return await this.cartsService.updateCartItem(cartId, itemId, updateCartItemDto.quantity);
  }

  @ApiOperation({
    summary: '장바구니 상품 삭제',
    description: '특정 장바구니에서 선택한 상품들을 삭제합니다.',
  })
  @ApiParam({
    name: 'cartId',
    required: true,
    description: '상품을 삭제할 장바구니 ID',
    example: 'rbh4ib2mt2pt5175wuf9wsz6',
  })
  @ApiBody({
    type: DeleteCartItemsDto,
    description: '삭제할 상품의 ID 목록',
    examples: {
      example1: {
        value: { itemIds: ['jlvtn4vc0wkycxa9c9koa2sw'] },
      },
    },
  })
  @ApiResponse({ status: 200, description: '상품 삭제 성공' })
  @Delete(':cartId/items')
  public async deleteCartItems(
    @Param('cartId') cartId: string,
    @Body() deleteDto: DeleteCartItemsDto,
  ): Promise<{ message: string }> {
    return await this.cartsService.deleteCartItems(cartId, deleteDto.itemIds);
  }
}
