import { Test, TestingModule } from '@nestjs/testing';
import { CartsController } from './carts.controller';
import { CartsService } from './carts.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { CartItem } from '@prisma/client';

describe('CartsController', () => {
  let controller: CartsController;
  let service: CartsService;

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

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [CartsController],
      providers: [
        CartsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    controller = module.get<CartsController>(CartsController);
    service = module.get<CartsService>(CartsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getCartItems', () => {
    it('should return cart items with totals', async () => {
      const result = {
        items: [mockCartItem],
        totalAmount: mockCartItem.quantity * mockProduct.price,
        shippingFee: 2500,
      };

      const spy = jest.spyOn(service, 'getCartItems').mockResolvedValue(result);

      const response = await controller.getCartItems(mockCart.id);

      expect(spy).toHaveBeenCalledWith(mockCart.id);
      expect(response).toEqual(result);
    });
  });

  describe('addToCart', () => {
    it('should add product to cart', async () => {
      const spy = jest.spyOn(service, 'addToCart').mockResolvedValue(mockCartItem);

      const response = await controller.addToCart(mockCart.id, {
        productId: mockProduct.id,
      });

      expect(spy).toHaveBeenCalledWith(mockCart.id, mockProduct.id);
      expect(response).toEqual(mockCartItem);
    });
  });

  describe('updateCartItem', () => {
    it('should update cart item quantity', async () => {
      const updatedItem = { ...mockCartItem, quantity: 3 };
      const spy = jest.spyOn(service, 'updateCartItem').mockResolvedValue(updatedItem);

      const response = await controller.updateCartItem(mockCart.id, mockCartItem.id, {
        quantity: 3,
      });

      expect(spy).toHaveBeenCalledWith(mockCart.id, mockCartItem.id, 3);
      expect(response).toEqual(updatedItem);
    });
  });

  describe('deleteCartItems', () => {
    it('should delete selected items from cart', async () => {
      const result = { message: '1개의 장바구니 항목이 삭제되었습니다.' };
      const spy = jest.spyOn(service, 'deleteCartItems').mockResolvedValue(result);

      const response = await controller.deleteCartItems(mockCart.id, {
        itemIds: [mockCartItem.id],
      });

      expect(spy).toHaveBeenCalledWith(mockCart.id, [mockCartItem.id]);
      expect(response).toEqual(result);
    });
  });
});
