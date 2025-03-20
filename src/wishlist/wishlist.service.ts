import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';

@Injectable()
export class WishlistService {
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
}
