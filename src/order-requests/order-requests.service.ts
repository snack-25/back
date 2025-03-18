import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRequest, OrderRequestStatus, Prisma, PrismaClient } from '@prisma/client';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { ApproveOrderRequestDto } from './dto/approve-order-request.dto';
import { RejectOrderRequestDto } from './dto/reject-order-request.dto';

@Injectable()
export class OrderRequestsService {
  private prisma: PrismaClient;
  constructor() {
    this.prisma = new PrismaClient();
  }

  // ✅ 일반 사용자(user)의 구매 요청 내역 조회 (본인의 `userId` 기준)
  async getUserOrderRequests(userId: string) {
    return this.prisma.orderRequest.findMany({
      where: { requesterId: userId },
      select: {
        createdAt: true, // 요청 날짜
        status: true, // 상태
        totalAmount: true, // 총 주문 금액
        orderRequestItems: {
          select: {
            price: true, // 상품 가격
            product: {
              select: { name: true }, // 상품 이름
            },
          },
        },
      },
    });
  }

  // ✅ 관리자(admin) & 최고 관리자(superadmin)의 회사 구매 요청 내역 조회 (로그인한 사용자의 `companyId` 기준)
  async getCompanyOrderRequests(companyId: string) {
    return this.prisma.orderRequest.findMany({
      where: { companyId },
      select: {
        createdAt: true, // 요청 날짜
        totalAmount: true, // 총 주문 금액
        requester: {
          select: { name: true }, // 요청한 사용자 이름
        },
        orderRequestItems: {
          select: {
            price: true, // 상품 가격
            product: {
              select: { name: true }, // 상품 이름
            },
          },
        },
      },
    });
  }

  // ✅ 주문 요청 생성
  async createOrderRequest(dto: CreateOrderRequestDto) {
    return this.prisma.$transaction(async tx => {
      // 1. 상품 정보 조회 (DB에서 가격 가져오기)
      const products = await tx.product.findMany({
        where: { id: { in: dto.items.map(item => item.productId) } }, // 요청된 모든 상품 ID 조회
        select: { id: true, price: true },
      });

      if (products.length !== dto.items.length) {
        throw new NotFoundException('존재하지 않는 상품이 포함되어 있습니다.');
      }

      // 2. 주문 요청 아이템 생성 (가격과 수량 계산)
      const orderRequestItems = dto.items.map(item => {
        const product = products.find(p => p.id === item.productId);
        if (!product) {
          throw new NotFoundException(`상품 ${item.productId}을 찾을 수 없습니다.`);
        }
        return {
          productId: product.id,
          quantity: item.quantity,
          price: product.price, // 상품 가격 (DB에서 조회된 값)
          notes: item.notes,
        };
      });

      // 3. 총액 계산
      const totalAmount = orderRequestItems.reduce(
        (sum, item) => sum + item.quantity * item.price,
        0,
      );

      // 4. 주문 요청 생성 (트랜잭션 내에서 수행)
      return tx.orderRequest.create({
        data: {
          requesterId: dto.requesterId,
          companyId: dto.companyId,
          status: OrderRequestStatus.PENDING, // 기본값 PENDING
          totalAmount, // 총 수량 저장
          orderRequestItems: {
            create: orderRequestItems, // 주문 요청 아이템 생성
          },
        },
        include: { orderRequestItems: true },
      });
    });
  }

  // ✅ 주문 요청 상세 조회
  async getOrderRequestDetail(orderRequestId: string) {
    const orderRequest = await this.prisma.orderRequest.findUnique({
      where: { id: orderRequestId },
      include: {
        orderRequestItems: {
          include: {
            product: {
              select: { name: true, price: true },
            },
          },
        },
        requester: {
          // 요청한 사람 정보 가져오기
          select: { name: true },
        },
        resolver: {
          // 요청을 처리한 사람 정보 가져오기 (null 가능)
          select: { name: true },
        },
      },
    });

    if (!orderRequest) {
      throw new NotFoundException('해당 주문 요청을 찾을 수 없습니다.');
    }

    return {
      requestId: orderRequest.id,
      status: orderRequest.status,
      requestedAt: orderRequest.createdAt, // 요청일
      resolvedAt: orderRequest.resolvedAt, // 처리일
      resolverMessage: orderRequest.notes, // 처리 메시지
      requesterName: orderRequest.requester?.name || '알 수 없음', // 요청한 사람의 이름
      resolverName: orderRequest.resolver?.name || null, // 처리한 사람의 이름
      items: orderRequest.orderRequestItems.map(item => ({
        productName: item.product?.name || '상품 정보 없음',
        quantity: item.quantity,
        price: item.product?.price || 0,
        notes: item.notes || null, // 주문 요청 시 입력한 메모
      })),
    };
  }

  // ✅ 주문 요청 승인
  async approveOrderRequest(orderRequestId: string, dto: ApproveOrderRequestDto) {
    // 1️⃣ 주문 요청 상태 확인
    const orderRequest = await this.prisma.orderRequest.findUnique({
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
    return this.prisma.orderRequest.update({
      where: { id: orderRequestId },
      data: {
        status: OrderRequestStatus.APPROVED,
        resolverId: dto.resolverId,
        notes: dto.notes, // 관리자 처리 메시지 저장
        resolvedAt: new Date(),
      },
    });
  }

  // ✅ 주문 요청 거절
  async rejectOrderRequest(orderRequestId: string, dto: RejectOrderRequestDto) {
    // 1️⃣ 주문 요청 상태 확인
    const orderRequest = await this.prisma.orderRequest.findUnique({
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
    return this.prisma.orderRequest.update({
      where: { id: orderRequestId },
      data: {
        status: OrderRequestStatus.REJECTED,
        resolverId: dto.resolverId,
        notes: dto.notes, // 관리자 처리 메시지 저장
        resolvedAt: new Date(),
      },
    });
  }

  // ✅ 주문 요청 ID로 상세 조회
  async getOrderRequestById(orderRequestId: string): Promise<OrderRequest | null> {
    return this.prisma.orderRequest.findUnique({
      where: { id: orderRequestId },
      include: { orderRequestItems: true }, // 필요한 관계 추가
    });
  }

  // ✅ 주문 요청 삭제 (트랜잭션)
  async deleteRequestAndItemsInTransaction(orderRequestId: string): Promise<void> {
    await this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      // 주문 요청 아이템들 삭제
      await tx.orderRequestItem.deleteMany({
        where: { orderRequestId },
      });

      // 주문 요청 삭제
      await tx.orderRequest.delete({
        where: { id: orderRequestId },
      });
    });
  }
}
