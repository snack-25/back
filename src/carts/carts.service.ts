import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { Cart, CartItem } from './dto/cart.interface';

@Injectable()
export class CartsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async addToCart(cartId: string, productId: string): Promise<CartItem> {
    const userId: string = '11'; // 임시 userId 설정

    const cart = (await this.prisma.cart.findUnique({
      where: { id: cartId },
    })) as Cart;

    if (!cart) {
      throw new NotFoundException('장바구니를 찾을 수 없습니다.');
    }

    if (cart.userId !== userId) {
      throw new ForbiddenException('잘못된 장바구니 접근입니다.');
    }

    const product = await this.prisma.product.findUnique({
      where: { id: productId },
    });

    if (!product) {
      throw new NotFoundException('존재하지 않는 상품입니다.');
    }

    let item = (await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    })) as CartItem;

    if (!item) {
      item = (await this.prisma.cartItem.create({
        data: { cartId, productId, quantity: 1 },
      })) as CartItem;
    }

    return item;
  }

  //장바구니 전체조회
  public async getCartItems(cartId: string): Promise<CartItem[]> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        cartItems: {
          include: { product: true },
        },
      },
    });

    if (!cart) {
      throw new NotFoundException('장바구니를 찾을 수 없습니다.');
    }

    return cart.cartItems;
  }

  //장바구니 수량 변경
  public async updateCartItem(cartId: string, itemId: string, quantity: number): Promise<CartItem> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
    });

    if (!item || item.cartId !== cartId) {
      throw new NotFoundException('장바구니 항목을 찾을 수 없습니다.');
    }

    return await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  //장바구니 상품 삭제
  public async deleteCartItems(cartId: string, itemIds: string[]): Promise<{ message: string }> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart) {
      throw new NotFoundException('장바구니를 찾을 수 없습니다.');
    }

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId,
        id: { in: itemIds },
      },
    });

    return { message: `${itemIds.length}개의 장바구니 항목이 삭제되었습니다.` };
  }
}
