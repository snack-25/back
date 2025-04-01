import { Prisma } from '@prisma/client';

/**
 * 주문 요청 정렬 기준을 설정하는 유틸 함수
 * @param sort 정렬 기준 (latest, lowPrice, highPrice)
 * @returns Prisma 정렬 객체
 */
export function getOrderBy(sort: string): Prisma.OrderRequestOrderByWithRelationInput {
  switch (sort) {
    case 'latest': // 최신순
      return { createdAt: 'desc' as Prisma.SortOrder };
    case 'lowPrice': // 낮은 가격순
      return { totalAmount: 'asc' as Prisma.SortOrder };
    case 'highPrice': // 높은 가격순
      return { totalAmount: 'desc' as Prisma.SortOrder };
    default: // 기본값 (최신순)
      return { createdAt: 'desc' as Prisma.SortOrder };
  }
}
