import { OrderRequestsService } from './order-requests.service';
import { OrderRequestsController } from './order-requests.controller';
import { Test, TestingModule } from '@nestjs/testing';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { UserRole, OrderRequestStatus } from '@prisma/client';
import { UnauthorizedException, ForbiddenException, NotFoundException } from '@nestjs/common';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';

describe('OrderRequestsController', () => {
  let service: OrderRequestsService;
  let controller: OrderRequestsController;
  // let prisma: PrismaService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [OrderRequestsController],
      providers: [
        OrderRequestsService,
        {
          provide: PrismaService,
          useValue: {
            orderRequest: {
              findMany: jest.fn(),
              create: jest.fn(),
              findUnique: jest.fn(),
              update: jest.fn(),
              delete: jest.fn(),
            },
            orderRequestItem: {
              deleteMany: jest.fn(),
            },
            product: {
              findMany: jest.fn(),
            },
            // eslint-disable-next-line @typescript-eslint/no-explicit-any
            $transaction: jest.fn((cb: any) =>
              // eslint-disable-next-line @typescript-eslint/no-unsafe-return, @typescript-eslint/no-unsafe-call
              cb({
                orderRequest: {
                  findMany: jest.fn(),
                  create: jest.fn(),
                  findUnique: jest.fn(),
                  update: jest.fn(),
                  delete: jest.fn(),
                },
                orderRequestItem: {
                  deleteMany: jest.fn(),
                },
                product: {
                  findMany: jest.fn(),
                },
              }),
            ),
          },
        },
        {
          provide: AuthService,
          useValue: {
            validateUser: jest.fn(),
          },
        },
      ],
    })
      .overrideGuard(AuthGuard) // AuthGuard를 Mock 처리
      .useValue({
        canActivate: jest.fn().mockResolvedValue(true),
      })
      .compile();

    service = module.get<OrderRequestsService>(OrderRequestsService);
    controller = module.get<OrderRequestsController>(OrderRequestsController);
    // prisma = module.get<PrismaService>(PrismaService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('createOrderRequest', () => {
    it('should throw UnauthorizedException if user is not authenticated', async () => {
      await expect(
        controller.createOrderRequest({} as Request, {
          items: [],
          companyId: '',
          requesterId: '',
          status: OrderRequestStatus.PENDING,
        }),
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe('approveOrderRequest', () => {
    it('should throw ForbiddenException if user is not an admin', async () => {
      const req = {
        user: { id: 'user123', role: UserRole.USER, companyId: 'company123' },
      } as unknown as Request;
      await expect(
        controller.approveOrderRequest(req, 'order1', {
          notes: 'Approved',
          resolverId: 'admin123',
        }),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if order request does not exist', async () => {
      jest.spyOn(service, 'getOrderRequestById').mockResolvedValue(null);
      const req = {
        user: { id: 'admin123', role: UserRole.ADMIN, companyId: 'company123' },
      } as unknown as Request;
      await expect(
        controller.approveOrderRequest(req, 'order1', {
          notes: 'Approved',
          resolverId: 'admin123',
        }),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
