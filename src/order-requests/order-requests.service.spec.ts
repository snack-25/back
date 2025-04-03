/* eslint-disable @typescript-eslint/no-unsafe-return */
/* eslint-disable @typescript-eslint/unbound-method */
import { NotFoundException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { OrderRequestStatus } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { OrderRequestsService } from './order-requests.service';

describe('OrderRequestsService', () => {
  let service: OrderRequestsService;
  let mockPrismaService: PrismaService;

  beforeEach(async () => {
    mockPrismaService = {
      $transaction: jest.fn(), // $transaction 메서드 모의
      orderRequest: {
        create: jest.fn(), // orderRequest.create 메서드 모의(mock)
      },
      product: {
        findMany: jest.fn(), // product.findMany 메서드 모의(mock)
      },
    } as unknown as PrismaService;

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        OrderRequestsService,
        { provide: PrismaService, useValue: mockPrismaService }, // PrismaService에 모의(mock) 객체 주입
      ],
    }).compile();

    service = module.get<OrderRequestsService>(OrderRequestsService);
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
      (mockPrismaService.$transaction as jest.Mock).mockImplementationOnce(callback => {
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
      const transactionMock = mockPrismaService.$transaction as jest.Mock;
      expect(transactionMock).toHaveBeenCalledTimes(1);
      expect(transactionMock).toHaveBeenCalledWith(expect.any(Function));
    });

    it('should throw an error if a product is not found', async () => {
      // Given
      const createOrderRequestDto: CreateOrderRequestDto = {
        requesterId: 'user-uuid-1234',
        companyId: 'company-uuid-5678',
        items: [{ productId: 'product-uuid-unknown', quantity: 2, notes: '메모 1' }],
      };

      // Mocking $transaction
      (mockPrismaService.$transaction as jest.Mock).mockImplementationOnce(callback => {
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
      await expect(service.createOrderRequest(createOrderRequestDto)).rejects.toThrow(
        NotFoundException,
      );
    });
  });
});
