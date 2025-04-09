import { ForbiddenException, Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { OrderRequestDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { OrderQueryDto } from './dto/update-order.dto';
import { ProductsService } from '@src/products/products.service';
import { CartsService } from '@src/carts/carts.service';
import { getShippingFeeByUserId } from '@src/shared/helpers/shipping.helper';
import { deductCompanyBudgetByUserId } from '@src/shared/helpers/budget.helper';
import { OrderDetailResponse } from './dto/orders.insterface';

@Injectable()
export class OrdersService {
  private readonly logger = new Logger(OrdersService.name);

  public constructor(
    private readonly prisma: PrismaService,
    private readonly productsService: ProductsService,
    private readonly cartsService: CartsService,
  ) {}

  //유저의 주문목록 조회
  public async getUserOrders(
    userId: string,
    query: OrderQueryDto,
    page: number,
    pageSize: number,
    sort: string,
  ): Promise<{ orders: Order[]; totalOrders: number; totalPages: number }> {
    const skip = (page - 1) * pageSize;
    const take = pageSize;

    const orderBy = {
      createdAt: sort === 'latest' ? 'asc' : 'desc',
    } as const;

    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      throw new NotFoundException('유저 또는 소속된 회사를 찾을 수 없습니다.');
    }

    const totalOrders = await this.prisma.order.count({
      where: {
        companyId: user.companyId,
        ...(query.status && { status: query.status }),
      },
    });

    const orders = await this.prisma.order.findMany({
      where: {
        companyId: user.companyId,
        ...(query.status && { status: query.status }),
      },
      orderBy,
      skip,
      take,
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
        requestedBy: {
          select: {
            id: true,
            name: true,
          },
        },
        updatedBy: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    });

    const totalPages = Math.ceil(totalOrders / pageSize);

    return { orders, totalOrders, totalPages };
  }

  //관리자, 최고관리자 주문하기
  public async createOrder(
    userId: string,
    role: string,
    orderData: OrderRequestDto,
  ): Promise<Order> {
    return await this.prisma.$transaction(async prisma => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true },
      });

      if (!user || !user.company) {
        throw new Error('유효하지 않은 사용자 또는 소속된 회사 없음.');
      }

      if (role !== 'ADMIN' && role !== 'SUPERADMIN') {
        throw new ForbiddenException('주문 권한이 없습니다.');
      }

      const productIds = orderData.items.map(item => item.productId);
      const productPriceMap = await this.productsService.getProductPricesByIds(productIds);

      let totalAmount = 0;
      const orderItems = orderData.items.map(item => {
        const productPrice = productPriceMap.get(item.productId);
        if (productPrice === undefined) {
          throw new NotFoundException(`상품을 찾을 수 없습니다. (productId: ${item.productId})`);
        }

        const itemTotal = productPrice * item.quantity;
        totalAmount += itemTotal;

        return {
          productId: item.productId,
          quantity: item.quantity,
          price: productPrice,
        };
      });

      let shippingFee = 0;
      try {
        shippingFee = await getShippingFeeByUserId(this.prisma, userId, totalAmount);
      } catch (error) {
        if (error instanceof Error) {
          this.logger.error(`배송비 계산 중 오류 발생: ${error.message}`, error.stack);
        } else {
          this.logger.error('배송비 계산 중 알 수 없는 오류 발생', error);
        }
      }
      totalAmount += shippingFee;

      await deductCompanyBudgetByUserId(this.prisma, userId, totalAmount);

      const order = await prisma.order.create({
        data: {
          companyId: user.company.id,
          createdById: userId,
          updatedById: userId,
          requestedById: userId,
          status: 'PROCESSING',
          totalAmount,
          shippingMethod: '택배',
          notes: '관리자가 주문한 상품입니다.',
          adminNotes: '관리자가 주문한 상품입니다.',
        },
      });

      await prisma.orderItem.createMany({
        data: orderItems.map(item => ({
          orderId: order.id,
          productId: item.productId,
          quantity: item.quantity,
          price: item.price,
        })),
      });

      await this.cartsService.clearCartItemsByUserId(userId);

      return order;
    });
  }

  //상품 상세조회
  public async getOrderDetail(userId: string, orderId: string): Promise<OrderDetailResponse> {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true },
    });

    if (!user || !user.companyId) {
      throw new NotFoundException('유저 또는 소속 회사를 찾을 수 없습니다.');
    }

    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        orderItems: {
          include: {
            product: {
              include: {
                category: true,
              },
            },
          },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('해당 주문을 찾을 수 없습니다.');
    }

    if (order.companyId !== user.companyId) {
      throw new ForbiddenException('이 주문을 조회할 권한이 없습니다.');
    }

    return {
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status as OrderDetailResponse['status'],
      totalAmount: order.totalAmount,
      shippingMethod: order.shippingMethod as string,
      adminNotes: order.adminNotes,
      notes: order.notes,
      createdAt: order.createdAt.toISOString(),
      updatedAt: order.updatedAt.toISOString(),
      deliveredAt: order.deliveredAt?.toISOString() || null,
      shippedAt: order.shippedAt?.toISOString() || null,
      trackingNumber: order.trackingNumber,
      orderItems: order.orderItems.map(item => ({
        productId: item.productId,
        productName: item.product.name,
        imageUrl: item.product.imageUrl,
        price: item.price,
        quantity: item.quantity,
        categoryId: item.product.category?.id || null,
        categoryName: item.product.category?.name || null,
      })),
    };
  }
}
