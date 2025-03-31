import { Test, TestingModule } from '@nestjs/testing';
import { OrdersService } from './orders.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { ProductsService } from '@src/products/products.service';
import { CartsService } from '@src/carts/carts.service';
import { OrderRequestDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/update-order.dto';
import { FeeType, Order } from '@prisma/client';

const userId = 'p9ri9lsfyxy4k4juq9nw2jpa';

const mockOrder: Order = {
  id: 'order-id',
  companyId: 'company-id',
  createdById: userId,
  updatedById: userId,
  requestedById: userId,
  status: 'PROCESSING',
  totalAmount: 60000,
  shippingMethod: '택배',
  notes: '관리자가 주문한 상품입니다.',
  adminNotes: '관리자가 주문한 상품입니다.',
  orderNumber: 'ORD123456',
  trackingNumber: null,
  shippedAt: null,
  deliveredAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  order: {
    count: jest.fn().mockResolvedValue(1),
    findMany: jest.fn().mockResolvedValue([mockOrder]),
    findUnique: jest.fn().mockResolvedValue(mockOrder),
    create: jest.fn().mockResolvedValue(mockOrder),
  },
  orderItem: {
    createMany: jest.fn().mockResolvedValue(undefined),
  },
  cartItem: {
    deleteMany: jest.fn().mockResolvedValue(undefined),
  },
  user: {
    findUnique: jest.fn().mockResolvedValue({
      id: userId,
      role: 'ADMIN',
      company: { id: 'company-id', zipcode: '12345' },
    }),
  },
  zipcode: {
    findFirst: jest.fn().mockResolvedValue({ feeType: FeeType.NOT_APPLICABLE }),
  },
  $transaction: jest
    .fn()
    .mockImplementation(async <T>(fn: (tx: typeof mockPrismaService) => Promise<T>): Promise<T> => {
      return await fn(mockPrismaService);
    }),
};

const mockProductsService = {
  getProductPricesByIds: jest.fn().mockResolvedValue(
    new Map([
      ['product-id-1', 20000],
      ['product-id-2', 20000],
    ]),
  ),
};

const mockCartsService = {
  clearCartItemsByUserId: jest.fn().mockResolvedValue(undefined),
};

describe('OrdersService', () => {
  let service: OrdersService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: ProductsService, useValue: mockProductsService },
        { provide: CartsService, useValue: mockCartsService },
      ],
    }).compile();

    service = module.get<OrdersService>(OrdersService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserOrders', () => {
    it('should return paginated orders', async () => {
      const query: OrderQueryDto = {};
      const result = await service.getUserOrders(userId, query, 1, 6, 'latest');
      expect(result.orders).toHaveLength(1);
      expect(result.totalOrders).toBe(1);
    });
  });

  describe('createOrder', () => {
    it('should create a new order and clear cart', async () => {
      const dto: OrderRequestDto = {
        items: [
          { productId: 'product-id-1', quantity: 1 },
          { productId: 'product-id-2', quantity: 2 },
        ],
      };

      const result = await service.createOrder(userId, dto);
      expect(result).toEqual(mockOrder);
      expect(mockProductsService.getProductPricesByIds).toHaveBeenCalled();
      expect(mockCartsService.clearCartItemsByUserId).toHaveBeenCalledWith(userId);
    });
  });

  describe('getOrderDetail', () => {
    it('should return order detail and total items', async () => {
      mockPrismaService.order.findUnique = jest.fn().mockResolvedValue({
        ...mockOrder,
        orderItems: [{ id: 'item1', product: {}, quantity: 1 }],
        createdBy: { name: '관리자' },
        requestedBy: { name: '관리자' },
      });

      const result = await service.getOrderDetail(userId, 'order-id');
      expect(result.order.id).toBe('order-id');
      expect(result.totalItems).toBe(1);
    });
  });
});
