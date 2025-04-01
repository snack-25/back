import { Test, TestingModule } from '@nestjs/testing';
import { OrderRequestsService } from './order-requests.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { NotFoundException } from '@nestjs/common';
import { OrderRequestStatus } from '@prisma/client';

describe('OrderRequestsService', () => {
  let service: OrderRequestsService;
  let prisma: PrismaService;

  beforeEach(async () => {
    const mockPrismaService = {
      $transaction: jest.fn(), // $transaction 메서드 모의(mock)
      orderRequest: {
        create: jest.fn(), // orderRequest.create 메서드 모의(mock)
      },
      product: {
        findMany: jest.fn(), // product.findMany 메서드 모의(mock)
      },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRequestsService,
        { provide: PrismaService, useValue: mockPrismaService }, // PrismaService에 모의(mock) 객체 주입
      ],
    }).compile();

    service = module.get<OrderRequestsService>(OrderRequestsService);
    prisma = module.get<PrismaService>(PrismaService);
  });

  describe('createOrderRequest', () => {
    it('should create a new order request and return it', async () => {
      // Given
      const createOrderRequestDto: CreateOrderRequestDto = {
        requesterId: 'user-uuid-1234',
        companyId: 'company-uuid-5678',
        items: [
          { productId: 'product-uuid-1234', quantity: 2, notes: '메모 1' },
          { productId: 'product-uuid-5678', quantity: 1, notes: '메모 2' },
        ],
      };

      const mockOrderRequest = {
        id: 'orderRequestId1',
        requesterId: createOrderRequestDto.requesterId,
        companyId: createOrderRequestDto.companyId,
        totalAmount: 500,
        status: OrderRequestStatus.PENDING,
        orderRequestItems: createOrderRequestDto.items.map(item => ({
          productId: item.productId,
          quantity: item.quantity,
          price: 100,
          notes: item.notes,
        })),
      };

      // Mocking $transaction
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const mockTx = {
          product: {
            findMany: jest.fn().mockResolvedValue([
              { id: 'product-uuid-1234', price: 100 },
              { id: 'product-uuid-5678', price: 100 },
            ]),
          },
          orderRequest: {
            create: jest.fn().mockResolvedValue(mockOrderRequest),
          },
        };
        return callback(mockTx);
      });

      // Act
      const result = await service.createOrderRequest(createOrderRequestDto);

      // Assert
      expect(result).toEqual(mockOrderRequest);
      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.$transaction).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should throw an error if a product is not found', async () => {
      // Given
      const createOrderRequestDto: CreateOrderRequestDto = {
        requesterId: 'user-uuid-1234',
        companyId: 'company-uuid-5678',
        items: [
          { productId: 'product-uuid-unknown', quantity: 2, notes: '메모 1' },
        ],
      };

      // Mocking $transaction
      (prisma.$transaction as jest.Mock).mockImplementationOnce(async (callback) => {
        const mockTx = {
          product: {
            findMany: jest.fn().mockResolvedValue([]), // No product found
          },
          orderRequest: {
            create: jest.fn(),
          },
        };
        return callback(mockTx);
      });

      // Act & Assert
      await expect(service.createOrderRequest(createOrderRequestDto)).rejects.toThrow(NotFoundException);
    });
  });
});
