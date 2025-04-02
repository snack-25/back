import { Test, TestingModule } from '@nestjs/testing';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { Order } from '@prisma/client';
import { OrderRequestDto } from './dto/create-order.dto';
import { OrderQueryDto } from './dto/update-order.dto';
import { AuthService } from '@src/auth/auth.service';
import { Request } from 'express';

describe('OrdersController', () => {
  let controller: OrdersController;
  let service: OrdersService;
  let authService: AuthService;

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

  const mockOrderRequestDto: OrderRequestDto = {
    items: [
      { productId: 'product-id-1', quantity: 2 },
      { productId: 'product-id-2', quantity: 1 },
    ],
  };

  const mockOrderListResponse = {
    orders: [mockOrder],
    totalOrders: 1,
    totalPages: 1,
  };

  const mockOrderDetailResponse = {
    order: mockOrder,
    totalItems: 1,
  };

  const mockRequest = (): Request =>
    ({
      cookies: {
        accessToken: 'mock-token',
      },
    }) as unknown as Request;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrdersController],
      providers: [
        {
          provide: OrdersService,
          useValue: {
            getUserOrders: jest.fn(),
            createOrder: jest.fn(),
            getOrderDetail: jest.fn(),
          },
        },
        {
          provide: AuthService,
          useValue: {
            getUserFromCookie: jest.fn(),
          },
        },
      ],
    }).compile();

    controller = module.get<OrdersController>(OrdersController);
    service = module.get<OrdersService>(OrdersService);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('getUserOrders', () => {
    it('should return paginated order list', async () => {
      const query: OrderQueryDto = {};
      const page = '1';
      const pageSize = '6';
      const sort = 'latest';
      const req = mockRequest();

      const authSpy = jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: userId, exp: Date.now() + 10000 });

      const serviceSpy = jest
        .spyOn(service, 'getUserOrders')
        .mockResolvedValue(mockOrderListResponse);

      const result = await controller.getUserOrders(req, query, page, pageSize, sort);

      expect(authSpy).toHaveBeenCalledWith(req);
      expect(serviceSpy).toHaveBeenCalledWith(userId, query, 1, 6, sort);
      expect(result).toEqual(mockOrderListResponse);
    });
  });

  describe('adminPurchase', () => {
    it('should create a new order', async () => {
      const req = mockRequest();

      const authSpy = jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: userId, exp: Date.now() + 10000 });

      const serviceSpy = jest.spyOn(service, 'createOrder').mockResolvedValue(mockOrder);

      const result = await controller.adminPurchase(req, mockOrderRequestDto);

      expect(authSpy).toHaveBeenCalledWith(req);
      expect(serviceSpy).toHaveBeenCalledWith(userId, mockOrderRequestDto);
      expect(result).toEqual(mockOrder);
    });
  });

  describe('getOrderDetail', () => {
    it('should return order detail by id', async () => {
      const req = mockRequest();

      const authSpy = jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: userId, exp: Date.now() + 10000 });

      const serviceSpy = jest
        .spyOn(service, 'getOrderDetail')
        .mockResolvedValue(mockOrderDetailResponse);

      const result = await controller.getOrderDetail(req, 'order-id');

      expect(authSpy).toHaveBeenCalledWith(req);
      expect(serviceSpy).toHaveBeenCalledWith(userId, 'order-id');
      expect(result).toEqual(mockOrderDetailResponse);
    });
  });
});
