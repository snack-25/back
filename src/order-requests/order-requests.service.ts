import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRequest, OrderRequestStatus, Prisma } from '@prisma/client';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { ApproveOrderRequestDto } from './dto/approve-order-request.dto';
import { RejectOrderRequestDto } from './dto/reject-order-request.dto';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { getShippingFeeByUserId } from '@src/shared/helpers/shipping.helper';
import { getOrderBy } from '@src/shared/utils/order-requestsSort.util';

@Injectable()
export class OrderRequestsService {
  // order-request.controller.spec.ts 21번째 줄에서 에러 발생(private로 선언된 생성자는 접근 불가)
  // private constructor(private readonly prisma: PrismaService) {}
  public constructor(private readonly prisma: PrismaService) {}

  // ✅ 일반 사용자(user)의 구매 요청 내역 조회 (본인의 `userId` 기준)
  async getUserOrderRequests(userId: string, page: number, pageSize: string, sort: string) {
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPageSize)) {
      throw new Error('pageSize는 숫자여야 합니다.');
    }

    return this.prisma.orderRequest.findMany({
      where: { requesterId: userId },
      orderBy: getOrderBy(sort), // 정렬 추가
      skip: (page - 1) * parsedPageSize, // 페이지네이션 적용
      take: parsedPageSize,
      select: {
        createdAt: true, // 요청 날짜
        status: true, // 상태
        totalAmount: true, // 총 주문 금액
        id: true, // 주문 요청 ID
        orderRequestItems: {
          select: {
            price: true, // 상품 가격
            product: {
              select: {
                name: true, // 상품 이름
                imageUrl: true, // 상품 이미지 URL 추가
              },
            },
          },
        },
      },
    });
  }

  // ✅ 관리자(admin) & 최고 관리자(superadmin)의 회사 구매 요청 내역 조회 (로그인한 사용자의 `companyId` 기준)
  async getCompanyOrderRequests(companyId: string, page: number, pageSize: string, sort: string) {
    // pageSize가 문자열로 들어올 경우 숫자로 변환
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPageSize)) {
      throw new Error('pageSize는 숫자여야 합니다.');
    }

    return this.prisma.orderRequest.findMany({
      where: { companyId },
      orderBy: getOrderBy(sort), // 정렬 추가
      skip: (page - 1) * parsedPageSize, // 페이지네이션 적용
      take: parsedPageSize, // take는 숫자여야 함
      select: {
        createdAt: true, // 요청 날짜
        totalAmount: true, // 총 주문 금액
        status: true, // 상태
        id: true, // 주문 요청 ID
        requester: {
          select: { name: true }, // 요청한 사용자 이름 (user 테이블)
        },
        resolver: {
          select: { name: true }, // 승인 담당자 이름 (user 테이블)
        },
        orderRequestItems: {
          select: {
            price: true, // 상품 가격
            product: {
              select: {
                name: true, // 상품 이름
                imageUrl: true, // 상품 이미지 URL 추가
              },
            },
          },
        },
      },
    });
  }
  
  // ✅ 주문 요청 생성
  public async createOrderRequest(dto: CreateOrderRequestDto): Promise<Partial<OrderRequest>> {
    return this.prisma.$transaction(async tx => {
      // 1. 상품 정보 조회 (DB에서 가격 가져오기)
      const products = await tx.product.findMany({
        where: { id: { in: dto.items.map(item => item.productId) } }, // 요청된 모든 상품 ID 조회
        select: { id: true, price: true },
      });

      if (products.length !== dto.items.length) {
        throw new NotFoundException('존재하지 않는 상품이 포함되어 있습니다.');
      }

      // 2. 상품 ID → 가격 매핑
      const productPriceMap = new Map(products.map(p => [p.id, p.price]));

      // 3. 주문 요청 아이템 생성 (가격 제외)
      const orderRequestItems = dto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: productPriceMap.get(item.productId) || 0, // 가격 포함
        notes: item.notes,
      }));

      // 4. 총액 계산
      const totalAmountWithoutShipping = dto.items.reduce(
        (sum, item) => sum + item.quantity * (productPriceMap.get(item.productId) || 0),
        0,
      );

      // 5. 배송비 계산
      const shippingFee = await getShippingFeeByUserId(this.prisma, dto.requesterId, totalAmountWithoutShipping);
      const totalAmount = totalAmountWithoutShipping + shippingFee;

      // 6. 주문 요청 생성 (트랜잭션 내에서 수행)
      return tx.orderRequest.create({
        data: {
          requesterId: dto.requesterId,
          companyId: dto.companyId,
          status: OrderRequestStatus.PENDING, // 기본값 PENDING
          totalAmount, // 총액 (배송비 포함)
          orderRequestItems: {
            create: orderRequestItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              requestMessage: item.notes,
            })), // Prisma의 모델에 맞게 `create` 형식으로 데이터 매핑
          },
        },
        include: { orderRequestItems: true }, // `orderRequestItems`를 포함
      });
    });
  }

  // ✅ 주문 요청 상세 조회
  public async getOrderRequestDetail(orderRequestId: string): Promise<any> {
    const orderRequest = await this.prisma.orderRequest.findUnique({
      where: { id: orderRequestId },
      include: {
        requester: { select: { name: true } }, // 요청한 사람 정보 조회
        resolver: { select: { name: true } }, // 처리한 사람 정보 조회 (nullable)
        orderRequestItems: {
          include: {
            product: {
              select: {
                name: true,
                price: true,
                imageUrl: true, // 🔹 상품 이미지 URL 추가
                category: {
                  // 🔹 카테고리 정보 가져오기 (ID + 이름)
                  select: {
                    id: true,
                    name: true, // 🔹 카테고리 이름 추가
                  },
                },
              },
            },
          },
        },
      },
    });

    if (!orderRequest) {
      throw new NotFoundException('해당 주문 요청을 찾을 수 없습니다.');
    }

    return {
      requesterId: orderRequest.requesterId,
      status: orderRequest.status,
      requestedAt: orderRequest.createdAt, // 요청일
      resolvedAt: orderRequest.resolvedAt, // 처리일
      resolverMessage: orderRequest.notes, // 처리 메시지
      requesterName: orderRequest.requester?.name || '알 수 없음', // 요청한 사람의 이름
      resolverName: orderRequest.resolver?.name || null, // 처리한 사람의 이름
      items: orderRequest.orderRequestItems.map(item => ({
        productName: item.product?.name || '상품 정보 없음',
        categoryId: item.product?.category?.id || null, // 🔹 카테고리 ID 추가
        categoryName: item.product?.category?.name || '카테고리 정보 없음', // 🔹 카테고리 이름 추가
        imageUrl: item.product?.imageUrl || null, // 🔹 이미지 URL 추가
        quantity: item.quantity,
        price: item.product?.price || 0,
        requestMessage: item.notes || null, // 주문 요청 시 입력한 메모
      })),
    };
  }

  // ✅ 주문 요청 승인
  public async approveOrderRequest(
    orderRequestId: string,
    dto: ApproveOrderRequestDto,
  ): Promise<Partial<OrderRequest>> {
    return this.prisma.$transaction(async tx => {
      // 1️⃣ 주문 요청 상태 확인
      const orderRequest = await tx.orderRequest.findUnique({
        where: { id: orderRequestId },
        select: { status: true }, // status만 조회
      });

      if (!orderRequest) {
        throw new BadRequestException('주문 요청을 찾을 수 없습니다.');
      }

      // 2️⃣ 이미 승인되었거나 거절된 경우 예외 처리
      if (
        orderRequest.status === OrderRequestStatus.APPROVED ||
        orderRequest.status === OrderRequestStatus.REJECTED
      ) {
        throw new BadRequestException('이미 처리된 주문 요청은 승인할 수 없습니다.');
      }

      // 3️⃣ 승인 처리 (상태 변경)
      return tx.orderRequest.update({
        where: { id: orderRequestId },
        data: {
          status: OrderRequestStatus.APPROVED,
          resolverId: dto.resolverId,
          notes: dto.notes, // 관리자 처리 메시지 저장
          resolvedAt: new Date(),
        },
      });
    });
  }

  // ✅ 주문 요청 거절
  public async rejectOrderRequest(
    orderRequestId: string,
    dto: RejectOrderRequestDto,
  ): Promise<Partial<OrderRequest>> {
    return this.prisma.$transaction(async tx => {
      // 1️⃣ 주문 요청 상태 확인
      const orderRequest = await tx.orderRequest.findUnique({
        where: { id: orderRequestId },
        select: { status: true }, // status만 조회
      });

      if (!orderRequest) {
        throw new BadRequestException('주문 요청을 찾을 수 없습니다.');
      }

      // 2️⃣ 이미 승인되었거나 거절된 경우 예외 처리
      if (
        orderRequest.status === OrderRequestStatus.APPROVED ||
        orderRequest.status === OrderRequestStatus.REJECTED
      ) {
        throw new BadRequestException('이미 처리된 주문 요청은 거절할 수 없습니다.');
      }

      // 3️⃣ 거절 처리 (상태 변경)
      return tx.orderRequest.update({
        where: { id: orderRequestId },
        data: {
          status: OrderRequestStatus.REJECTED,
          resolverId: dto.resolverId,
          notes: dto.notes, // 관리자 처리 메시지 저장
          resolvedAt: new Date(),
        },
      });
    });
  }

  // ✅ 주문 요청 ID로 상세 조회
  public async getOrderRequestById(orderRequestId: string): Promise<OrderRequest | null> {
    return this.prisma.orderRequest.findUnique({
      where: { id: orderRequestId },
      include: { orderRequestItems: true }, // 필요한 관계 추가
    });
  }

  // ✅ 주문 요청 삭제 (트랜잭션)
  public async deleteRequestAndItemsInTransaction(orderRequestId: string): Promise<void> {
    try {
      await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
        // 🔹 1. 주문 요청이 존재하는지 확인
        const orderRequest = await tx.orderRequest.findUnique({
          where: { id: orderRequestId },
        });

        if (!orderRequest) {
          throw new NotFoundException('주문 요청을 찾을 수 없습니다.');
        }

        // 🔹 2. PENDING 상태가 아닌 경우 삭제 불가
        if (orderRequest.status !== OrderRequestStatus.PENDING) {
          throw new BadRequestException('이미 처리된 주문 요청은 삭제할 수 없습니다.');
        }

        // 🔹 3. 주문 요청 아이템 삭제
        await tx.orderRequestItem.deleteMany({
          where: { orderRequestId },
        });

        // 🔹 4. 주문 요청 삭제
        await tx.orderRequest.delete({
          where: { id: orderRequestId },
        });
      });
    } catch (error) {
      if (error instanceof NotFoundException || error instanceof BadRequestException) {
        throw error; // 명시적인 예외는 그대로 반환
      }
      throw new BadRequestException('삭제 중 오류가 발생했습니다.');
    }
  }
}
