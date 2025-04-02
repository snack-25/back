import { ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { OrderRequestDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { OrderQueryDto } from './dto/update-order.dto';
import { ProductsService } from '@src/products/products.service';
import { CartsService } from '@src/carts/carts.service';
import { getShippingFeeByUserId } from '@src/shared/helpers/shipping.helper';

@Injectable()
export class OrdersService {
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

    const totalOrders = await this.prisma.order.count({
      where: {
        OR: [{ createdById: userId }, { requestedById: userId }],
        ...(query.status && { status: query.status }),
      },
    });

    const orders = await this.prisma.order.findMany({
      where: {
        OR: [{ createdById: userId }, { requestedById: userId }],
        ...(query.status && { status: query.status }),
      },
      orderBy,
      skip,
      take,
    });

    const totalPages = Math.ceil(totalOrders / pageSize);

    return { orders, totalOrders, totalPages };
  }

  //관리자, 최고관리자 주문하기
  public async createOrder(userId: string, orderData: OrderRequestDto): Promise<Order> {
    return await this.prisma.$transaction(async prisma => {
      const user = await prisma.user.findUnique({
        where: { id: userId },
        include: { company: true },
      });

      if (!user || !user.company) {
        throw new Error('유효하지 않은 사용자 또는 소속된 회사 없음.');
      }

      if (user.role !== 'ADMIN' && user.role !== 'SUPERADMIN') {
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

      // 💡 여기서 배송비 계산
      const shippingFee = await getShippingFeeByUserId(this.prisma, userId, totalAmount);
      totalAmount += shippingFee;

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
  public async getOrderDetail(
    userId: string,
    orderId: string,
  ): Promise<{ order: Order; totalItems: number }> {
    const order = await this.prisma.order.findUnique({
      where: { id: orderId },
      include: {
        createdBy: { select: { name: true } },
        requestedBy: { select: { name: true } },
        orderItems: {
          include: { product: true },
        },
      },
    });

    if (!order) {
      throw new NotFoundException('해당 주문을 찾을 수 없습니다.');
    }

    if (order.requestedById !== userId) {
      throw new ForbiddenException('이 주문을 조회할 권한이 없습니다.');
    }

    const totalItems = order.orderItems.length;

    return { order, totalItems };
  }
}
