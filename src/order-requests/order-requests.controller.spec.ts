/* eslint-disable @typescript-eslint/no-unsafe-return */
import { ForbiddenException, NotFoundException, UnauthorizedException } from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { UserRole } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import type { Request } from 'express';
import { AuthGuard } from '../auth/auth.guard';
import { AuthService } from '../auth/auth.service';
import { OrderRequestsController } from './order-requests.controller';
import { OrderRequestsService } from './order-requests.service';

describe('OrderRequestsController', () => {
  let service: OrderRequestsService;
  let controller: OrderRequestsController;

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
            $transaction: jest.fn(cb =>
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
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
    expect(controller).toBeDefined();
  });

  describe('createOrderRequest', () => {
    it('should throw UnauthorizedException if user is not authenticated', async () => {
      await expect(
        controller.createOrderRequest({} as Request, { items: [], companyId: '', requesterId: '' }),
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
