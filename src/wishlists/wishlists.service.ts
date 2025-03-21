import { Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';

@Injectable()
export class WishlistsService {
  public constructor(private readonly prisma: PrismaService) {}

  // 찜한 상품 ID 리스트 반환
  public async getWishlist(userId: string): Promise<string[]> {
    const wishlist = await this.prisma.wishlist.findMany({
      where: { userId },
      select: { productId: true },
    });

    return wishlist.map(w => w.productId);
  }

  // 찜하기 / 찜 취소
  public async toggleWishlist(userId: string, productId: string): Promise<{ message: string }> {
    return this.prisma.$transaction(async tx => {
      const wishlist = await tx.wishlist.findUnique({
        where: { userId_productId: { userId, productId } },
      });

      if (wishlist) {
        await tx.wishlist.delete({
          where: { userId_productId: { userId, productId } },
        });
        return { message: '찜이 취소되었습니다.' };
      }

      await tx.wishlist.create({
        data: { userId, productId },
      });

      return { message: '찜 목록에 추가되었습니다.' };
    });
  }

  //찜목록 -> 장바구니 상품이동
  public async moveWishlistToCart(
    userId: string,
    productIds: string[],
  ): Promise<{ message: string }> {
    if (!productIds || productIds.length === 0) {
      return { message: '이동할 상품이 없습니다.' };
    }

    return await this.prisma.$transaction(async tx => {
      const cart = await tx.cart.findUnique({
        where: { userId },
      });

      if (!cart) {
        throw new NotFoundException('장바구니를 찾을 수 없습니다.');
      }

      const cartId = cart.id;

      const existingCartItems = await tx.cartItem.findMany({
        where: {
          cartId,
          productId: { in: productIds },
        },
        select: { productId: true },
      });

      const existingCartProductIds = new Set(existingCartItems.map(item => item.productId));

      const productsToMove = productIds.filter(productId => !existingCartProductIds.has(productId));

      if (productsToMove.length === 0) {
        return { message: '상품이 이미 장바구니에 존재합니다.' };
      }

      await tx.cartItem.createMany({
        data: productsToMove.map(productId => ({
          cartId,
          productId,
          quantity: 1,
        })),
      });

      await tx.wishlist.deleteMany({
        where: {
          userId,
          productId: { in: productsToMove },
        },
      });

      return { message: `${productsToMove.length}개의 상품이 장바구니로 이동되었습니다.` };
    });
  }
}
