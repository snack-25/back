import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { Cart, CartItem } from './dto/cart.interface';
import { getShippingFeeByUserId } from '@src/shared/helpers/shipping.helper';

@Injectable()
export class CartsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async addToCart(userId: string, cartId: string, productId: string): Promise<CartItem> {
    const cart = await this.prisma.cart.findUnique({ where: { id: cartId } });

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

    let item = await this.prisma.cartItem.findUnique({
      where: { cartId_productId: { cartId, productId } },
    });

    if (!item) {
      item = await this.prisma.cartItem.create({
        data: { cartId, productId, quantity: 1 },
      });
    }

    return item;
  }

  public async getCartItems(
    userId: string,
    cartId: string,
  ): Promise<{
    items: CartItem[];
    totalAmount: number;
    shippingFee: number;
  }> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
      include: {
        cartItems: {
          include: { product: true },
        },
      },
    });

    if (!cart || cart.userId !== userId) {
      throw new ForbiddenException('잘못된 장바구니 접근입니다.');
    }

    const totalAmount = cart.cartItems.reduce((acc, item) => {
      return acc + item.quantity * item.product.price;
    }, 0);

    const shippingFee = await getShippingFeeByUserId(this.prisma, userId, totalAmount);

    return {
      items: cart.cartItems,
      totalAmount,
      shippingFee,
    };
  }

  public async updateCartItem(
    userId: string,
    cartId: string,
    quantity: number,
    itemId: string,
  ): Promise<CartItem> {
    const item = await this.prisma.cartItem.findUnique({
      where: { id: itemId },
      include: { cart: true },
    });

    if (!item || item.cartId !== cartId || item.cart.userId !== userId) {
      throw new ForbiddenException('잘못된 장바구니 접근입니다.');
    }

    return await this.prisma.cartItem.update({
      where: { id: itemId },
      data: { quantity },
    });
  }

  public async deleteCartItems(
    userId: string,
    cartId: string,
    itemIds: string[],
  ): Promise<{ message: string }> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart || cart.userId !== userId) {
      throw new ForbiddenException('잘못된 장바구니 접근입니다.');
    }

    await this.prisma.cartItem.deleteMany({
      where: {
        cartId,
        id: { in: itemIds },
      },
    });

    return { message: `${itemIds.length}개의 장바구니 항목이 삭제되었습니다.` };
  }

  public async getCartByUserId(userId: string): Promise<Cart> {
    const cart = await this.prisma.cart.findUnique({ where: { userId } });
    if (!cart) throw new NotFoundException('장바구니를 찾을 수 없습니다.');
    return cart;
  }

  public async getCartProductIds(cartId: string, productIds: string[]): Promise<string[]> {
    const existingItems = await this.prisma.cartItem.findMany({
      where: {
        cartId,
        productId: { in: productIds },
      },
      select: { productId: true },
    });
    return existingItems.map(item => item.productId);
  }

  public async addProductsToCart(cartId: string, productIds: string[]): Promise<{ count: number }> {
    return this.prisma.cartItem.createMany({
      data: productIds.map(productId => ({
        cartId,
        productId,
        quantity: 1,
      })),
    });
  }

  public async clearCartItemsByUserId(userId: string): Promise<void> {
    const cart = await this.prisma.cart.findUnique({
      where: { userId },
      select: { id: true },
    });

    if (!cart) {
      throw new NotFoundException('장바구니를 찾을 수 없습니다.');
    }

    await this.prisma.cartItem.deleteMany({
      where: { cartId: cart.id },
    });
  }
}
