import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { OrderRequest, OrderRequestStatus, Prisma } from '@prisma/client';
import { getShippingFeeByUserId } from '@src/shared/helpers/shipping.helper';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { getOrderBy } from '@src/shared/utils/order-requestsSort.util';
import { ApproveOrderRequestDto } from './dto/approve-order-request.dto';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import {
  OrderRequestDetailResponse,
  OrderRequestResponseDto,
} from './dto/order-request-detail-response.interface';
import { RejectOrderRequestDto } from './dto/reject-order-request.dto';

@Injectable()
export class OrderRequestsService {
  // order-request.controller.spec.ts 21번째 줄에서 에러 발생(private로 선언된 생성자는 접근 불가)
  // private constructor(private readonly prisma: PrismaService) {}
  public constructor(private readonly prisma: PrismaService) {}

  public async getUserOrderRequests(
    userId: string,
    page: number,
    pageSize: string,
    sort: string,
  ): Promise<OrderRequestResponseDto[]> {
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPageSize)) {
      throw new Error('pageSize는 숫자여야 합니다.');
    }

    const orders = await this.prisma.orderRequest.findMany({
      where: { requesterId: userId },
      orderBy: getOrderBy(sort),
      skip: (page - 1) * parsedPageSize,
      take: parsedPageSize,
      select: {
        id: true,
        companyId: true,
        requesterId: true,
        resolverId: true,
        status: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
        resolvedAt: true,
        requester: {
          select: { name: true }, // ✅ 요청자 이름 조회
        },
        resolver: {
          select: { name: true }, // ✅ 처리자 이름 조회
        },
        orderRequestItems: {
          select: {
            price: true,
            quantity: true,
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return orders.map(order => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      requestedAt: order.createdAt,
      requesterId: order.requesterId,
      requesterName: order.requester?.name || '알 수 없음', // ✅ 요청자 이름 추가
      resolverId: order.resolverId,
      resolverName: order.resolver?.name || null, // ✅ 처리자 이름 추가
      resolvedAt: order.resolvedAt,
      resolverMessage: order.notes,
      companyId: order.companyId,
      orderRequestItems: order.orderRequestItems,
    }));
  }

  public async getCompanyOrderRequests(
    companyId: string,
    page: number,
    pageSize: string,
    sort: string,
  ): Promise<OrderRequestResponseDto[]> {
    const parsedPageSize = parseInt(pageSize, 10);

    if (isNaN(parsedPageSize)) {
      throw new Error('pageSize는 숫자여야 합니다.');
    }

    const orders = await this.prisma.orderRequest.findMany({
      where: { companyId },
      orderBy: getOrderBy(sort),
      skip: (page - 1) * parsedPageSize,
      take: parsedPageSize,
      select: {
        id: true,
        companyId: true,
        requesterId: true,
        resolverId: true,
        status: true,
        totalAmount: true,
        notes: true,
        createdAt: true,
        resolvedAt: true,
        requester: {
          select: { name: true }, // ✅ 요청자 이름 조회
        },
        resolver: {
          select: { name: true }, // ✅ 처리자 이름 조회
        },
        orderRequestItems: {
          select: {
            price: true,
            quantity: true,
            product: {
              select: {
                name: true,
                imageUrl: true,
              },
            },
          },
        },
      },
    });

    return orders.map(order => ({
      id: order.id,
      status: order.status,
      totalAmount: order.totalAmount,
      requestedAt: order.createdAt,
      requesterId: order.requesterId,
      requesterName: order.requester?.name || '알 수 없음', // ✅ 요청자 이름 추가
      resolverId: order.resolverId,
      resolverName: order.resolver?.name || null, // ✅ 처리자 이름 추가
      resolvedAt: order.resolvedAt,
      resolverMessage: order.notes,
      companyId: order.companyId,
      orderRequestItems: order.orderRequestItems,
    }));
  }

  // ✅ 주문 요청 생성
  public async createOrderRequest(dto: CreateOrderRequestDto): Promise<OrderRequestResponseDto> {
    return this.prisma.$transaction(async tx => {
      // 1. 상품 정보 조회 (DB에서 가격 가져오기)
      const products = await tx.product.findMany({
        where: { id: { in: dto.items.map(item => item.productId) } },
        select: { id: true, price: true, name: true, imageUrl: true },
      });

      if (products.length !== dto.items.length) {
        throw new NotFoundException('존재하지 않는 상품이 포함되어 있습니다.');
      }

      // 2. 상품 ID → 가격 및 기타 정보 매핑
      const productMap = new Map(products.map(p => [p.id, p]));

      // 3. 주문 요청 아이템 생성
      const orderRequestItems = dto.items.map(item => ({
        productId: item.productId,
        quantity: item.quantity,
        price: productMap.get(item.productId)?.price || 0,
        notes: item.requestMessage || null, // requestMessage 대신 notes 사용
      }));

      // 4. 총액 계산
      const totalAmountWithoutShipping = dto.items.reduce(
        (sum, item) => sum + item.quantity * (productMap.get(item.productId)?.price || 0),
        0,
      );

      // 5. 배송비 계산
      const shippingFee = await getShippingFeeByUserId(
        this.prisma,
        dto.requesterId,
        totalAmountWithoutShipping,
      );
      const totalAmount = totalAmountWithoutShipping + shippingFee;

      // 6. 주문 요청 생성
      const orderRequest = await tx.orderRequest.create({
        data: {
          requesterId: dto.requesterId,
          companyId: dto.companyId,
          status: dto.status, // 역할에 따른 상태 설정
          totalAmount,
          orderRequestItems: {
            create: orderRequestItems.map(item => ({
              productId: item.productId,
              quantity: item.quantity,
              price: item.price,
              notes: item.notes, // requestMessage -> notes로 변경
            })),
          },
        },
        include: {
          orderRequestItems: {
            include: {
              product: true, // 상품 정보 포함
            },
          },
          requester: { select: { name: true } }, // 요청자 이름 조회
          resolver: { select: { name: true } }, // 처리자 이름 조회 (없을 수도 있음)
        },
      });

      // 7. DTO 형태로 변환하여 반환
      return {
        id: orderRequest.id,
        status: orderRequest.status,
        totalAmount: orderRequest.totalAmount,
        requestedAt: orderRequest.createdAt,
        requesterId: orderRequest.requesterId,
        requesterName: orderRequest.requester?.name || '알 수 없음',
        resolverId: orderRequest.resolverId,
        resolverName: orderRequest.resolver?.name || null,
        resolvedAt: orderRequest.resolvedAt,
        resolverMessage: null,
        companyId: orderRequest.companyId,
        orderRequestItems: orderRequest.orderRequestItems.map(item => ({
          price: item.price,
          quantity: item.quantity,
          product: {
            name: item.product.name,
            imageUrl: item.product.imageUrl,
            requestMessage: item.notes || null, // 주문 요청 시 입력한 메모
          },
        })),
      };
    });
  }

  // ✅ 주문 요청 상세 조회
  public async getOrderRequestDetail(orderRequestId: string): Promise<OrderRequestDetailResponse> {
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
      status: orderRequest.status, // 주문 요청 상태
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
  ): Promise<OrderRequestResponseDto> {
    return this.prisma.$transaction(async tx => {
      // 1️⃣ 주문 요청 상태 확인
      const orderRequest = await tx.orderRequest.findUnique({
        where: { id: orderRequestId },
        select: { status: true },
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

      // 3️⃣ 주문 요청 승인 처리
      const updatedOrderRequest = await tx.orderRequest.update({
        where: { id: orderRequestId },
        data: {
          status: OrderRequestStatus.APPROVED,
          resolverId: dto.resolverId,
          notes: dto.notes,
          resolvedAt: new Date(),
        },
        include: {
          resolver: { select: { name: true } }, // 처리자 이름 조회
          orderRequestItems: {
            include: {
              product: { select: { name: true, price: true, imageUrl: true } },
            },
          },
        },
      });

      return {
        id: updatedOrderRequest.id,
        status: updatedOrderRequest.status,
        totalAmount: updatedOrderRequest.totalAmount,
        requestedAt: updatedOrderRequest.createdAt,
        requesterId: updatedOrderRequest.requesterId,
        resolverId: updatedOrderRequest.resolverId,
        resolvedAt: updatedOrderRequest.resolvedAt,
        resolverMessage: updatedOrderRequest.notes,
        companyId: updatedOrderRequest.companyId,
        orderRequestItems: updatedOrderRequest.orderRequestItems.map(item => ({
          price: item.price,
          quantity: item.quantity,
          product: {
            name: item.product?.name || '상품 정보 없음',
            imageUrl: item.product?.imageUrl || null,
          },
        })),
      };
    });
  }

  // ✅ 주문 요청 거절
  public async rejectOrderRequest(
    orderRequestId: string,
    dto: RejectOrderRequestDto,
  ): Promise<OrderRequestResponseDto> {
    return this.prisma.$transaction(async tx => {
      // 1️⃣ 주문 요청 상태 확인
      const orderRequest = await tx.orderRequest.findUnique({
        where: { id: orderRequestId },
        select: { status: true },
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

      // 3️⃣ 주문 요청 거절 처리
      const updatedOrderRequest = await tx.orderRequest.update({
        where: { id: orderRequestId },
        data: {
          status: OrderRequestStatus.REJECTED,
          resolverId: dto.resolverId,
          notes: dto.notes || null,
          resolvedAt: new Date(),
        },
        include: {
          resolver: { select: { name: true } }, // 처리자 이름 조회
          orderRequestItems: {
            include: {
              product: { select: { name: true, price: true, imageUrl: true } },
            },
          },
        },
      });

      return {
        id: updatedOrderRequest.id,
        status: updatedOrderRequest.status,
        totalAmount: updatedOrderRequest.totalAmount,
        requestedAt: updatedOrderRequest.createdAt,
        requesterId: updatedOrderRequest.requesterId,
        resolverId: updatedOrderRequest.resolverId,
        resolvedAt: updatedOrderRequest.resolvedAt,
        resolverMessage: updatedOrderRequest.notes,
        companyId: updatedOrderRequest.companyId,
        orderRequestItems: updatedOrderRequest.orderRequestItems.map(item => ({
          price: item.price,
          quantity: item.quantity,
          product: {
            name: item.product?.name || '상품 정보 없음',
            imageUrl: item.product?.imageUrl || null,
          },
        })),
      };
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
