import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { AuthService } from '@src/auth/auth.service';
import { CartItem } from '@prisma/client';
import { Request } from 'express';

describe('CartsController', () => {
  let controller: CartsController;
  let service: CartsService;
  let authService: AuthService;

  const mockPrismaService = {
    cart: { findUnique: jest.fn() },
    cartItem: {
      findUnique: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      deleteMany: jest.fn(),
    },
    product: { findUnique: jest.fn() },
  };

  const mockAuthService = {
    getUserFromCookie: jest.fn(),
  };

  const mockCart = {
    id: 'bhcxqfshp43wkskocodegc7x',
    userId: 'test-user-id',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockProduct = {
    id: 'qbrpeogbp7bwzk57x2xed0v3',
    name: '허니버터칩',
    price: 1500,
    description: '달콤한 허니버터 맛이 일품인 과자',
    categoryId: 'd8031i1djxm1hh5rpmpv2smc',
    imageUrl: 'https://placehold.co/600x400?text=honeybutter',
    totalSold: 0,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockCartItem: CartItem = {
    id: 'mock-cart-item-id',
    cartId: mockCart.id,
    productId: mockProduct.id,
    quantity: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  const mockRequest = (): Partial<Request> => ({
    cookies: {
      accessToken: 'mock-token',
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        CartsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
    service = module.get<CartsService>(CartsService);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('getCartItems', () => {
    it('should return cart items with totals', async () => {
      const result = {
        items: [mockCartItem],
        totalAmount: mockCartItem.quantity * mockProduct.price,
        shippingFee: 2500,
      };

      jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: mockCart.userId, exp: Date.now() + 10000 });
      const spy = jest.spyOn(service, 'getCartItems').mockResolvedValue(result);

      const req = mockRequest() as Request;
      const response = await controller.getCartItems(mockCart.id, req);

      expect(spy).toHaveBeenCalledWith(mockCart.userId, mockCart.id);
      expect(response).toEqual(result);
    });
  });

  describe('addToCart', () => {
    it('should add product to cart', async () => {
      jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: mockCart.userId, exp: Date.now() + 10000 });
      const spy = jest.spyOn(service, 'addToCart').mockResolvedValue(mockCartItem);

      const req = mockRequest() as Request;
      const response = await controller.addToCart(mockCart.id, { productId: mockProduct.id }, req);

      expect(spy).toHaveBeenCalledWith(mockCart.userId, mockCart.id, mockProduct.id);
      expect(response).toEqual(mockCartItem);
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      const updatedItem = { ...mockCartItem, quantity: 3 };
      jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: mockCart.userId, exp: Date.now() + 10000 });
      const spy = jest.spyOn(service, 'updateCartItem').mockResolvedValue(updatedItem);

      const req = mockRequest() as Request;
      const response = await controller.updateCartItem(
        mockCart.id,
        mockCartItem.id,
        { quantity: 3 },
        req,
      );

      expect(spy).toHaveBeenCalledWith(mockCart.userId, mockCart.id, 3, mockCartItem.id);
      expect(response).toEqual(updatedItem);
    });
  });

  describe('deleteCartItems', () => {
    it('should delete selected items from cart', async () => {
      const result = { message: '1개의 장바구니 항목이 삭제되었습니다.' };
      jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: mockCart.userId, exp: Date.now() + 10000 });
      const spy = jest.spyOn(service, 'deleteCartItems').mockResolvedValue(result);

      const req = mockRequest() as Request;
      const response = await controller.deleteCartItems(
        mockCart.id,
        { itemIds: [mockCartItem.id] },
        req,
      );

      expect(spy).toHaveBeenCalledWith(mockCart.userId, mockCart.id, [mockCartItem.id]);
      expect(response).toEqual(result);
    });
  });
});
