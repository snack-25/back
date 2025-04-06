import { Injectable, ForbiddenException, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { Cart, CartItem, GetCartItemsResponse, GetCartSummaryResponse } from './dto/cart.interface';
import { getShippingFeeByUserId } from '@src/shared/helpers/shipping.helper';
import { getEstimatedRemainingBudgetByUserId } from '@src/shared/helpers/budget.helper';

@Injectable()
export class CartsService {
  private readonly logger = new Logger(CartsService.name);
  public constructor(private readonly prisma: PrismaService) {}

  public async addToCart(
    userId: string,
    cartId: string,
    productId: string,
    quantity: number = 1,
  ): Promise<CartItem> {
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
        data: { cartId, productId, quantity },
      });
    } else {
      item = await this.prisma.cartItem.update({
        where: { id: item.id },
        data: { quantity: item.quantity + quantity },
      });
    }

    return item;
  }

  public async getCartItems(userId: string, cartId: string): Promise<GetCartItemsResponse> {
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

    const totalAmount = cart.cartItems.reduce(
      (acc, item) => acc + item.quantity * item.product.price,
      0,
    );

    let shippingFee = 0;
    try {
      shippingFee = await getShippingFeeByUserId(this.prisma, userId, totalAmount);
    } catch (error) {
      this.logger.error('배송비 계산 실패', error);
    }

    let originalBudget = 0;
    try {
      const budgetInfo = await getEstimatedRemainingBudgetByUserId(this.prisma, userId, 0);
      originalBudget = budgetInfo.originalBudget;
    } catch (error) {
      this.logger.warn('예산 조회 실패', error);
    }

    return {
      items: cart.cartItems,
      totalAmount,
      shippingFee,
      estimatedRemainingBudget: null,
      originalBudget,
    };
  }

  public async getSummaryBySelectedItems(
    userId: string,
    cartId: string,
    items: { productId: string; quantity: number }[],
  ): Promise<GetCartSummaryResponse> {
    const cart = await this.prisma.cart.findUnique({
      where: { id: cartId },
    });

    if (!cart || cart.userId !== userId) {
      throw new ForbiddenException('잘못된 장바구니 접근입니다.');
    }

    const products = await this.prisma.product.findMany({
      where: { id: { in: items.map(i => i.productId) } },
    });

    const productMap = new Map(products.map(p => [p.id, p]));

    const totalAmount = items.reduce((acc, item) => {
      const product = productMap.get(item.productId);
      if (!product) return acc;
      return acc + product.price * item.quantity;
    }, 0);

    let shippingFee = 0;
    try {
      shippingFee = await getShippingFeeByUserId(this.prisma, userId, totalAmount);
    } catch (error) {
      this.logger.error('선택된 항목 배송비 계산 실패', error);
    }

    let originalBudget = 0;
    let estimatedRemainingBudget = 0;

    try {
      const budgetInfo = await getEstimatedRemainingBudgetByUserId(
        this.prisma,
        userId,
        totalAmount + shippingFee,
      );
      originalBudget = budgetInfo.originalBudget;
      estimatedRemainingBudget = budgetInfo.estimatedRemainingBudget;
    } catch (error) {
      this.logger.warn('예산 조회 실패 (선택된 상품)', error);
    }

    return {
      totalAmount,
      shippingFee,
      estimatedRemainingBudget,
      originalBudget,
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
