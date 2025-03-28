import { Test, TestingModule } from '@nestjs/testing';
import { CartsService } from './carts.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { NotFoundException, ForbiddenException } from '@nestjs/common';

const mockCart = {
  id: 'test-cart-id',
  userId: 'xcl94l94lyb6dqceqi71r7z3', // 임시 고정 userid
  cartItems: [],
};

const mockProduct = {
  id: 'test-product-id',
  name: 'Test Product',
  price: 1000,
};

const mockCartItem = {
  id: 'test-cart-item-id',
  cartId: mockCart.id,
  productId: mockProduct.id,
  quantity: 1,
  createdAt: new Date(),
  updatedAt: new Date(),
};

const mockPrismaService = {
  cart: {
    findUnique: jest.fn(),
  },
  product: {
    findUnique: jest.fn(),
  },
  cartItem: {
    findUnique: jest.fn(),
    create: jest.fn(),
    update: jest.fn(),
    deleteMany: jest.fn(),
    findMany: jest.fn(),
    createMany: jest.fn(),
  },
};

describe('CartsService', () => {
  let service: CartsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CartsService,
        {
          provide: PrismaService,
          useValue: mockPrismaService,
        },
      ],
    }).compile();

    service = module.get<CartsService>(CartsService);
    jest.clearAllMocks();
  });

  describe('addToCart', () => {
    it('should add a new item to cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.product.findUnique.mockResolvedValue(mockProduct);
      mockPrismaService.cartItem.findUnique.mockResolvedValue(null);
      mockPrismaService.cartItem.create.mockResolvedValue(mockCartItem);

      const result = await service.addToCart(mockCart.id, mockProduct.id);
      expect(result).toEqual(mockCartItem);
    });

    it('should throw if cart not found', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(null);
      await expect(service.addToCart(mockCart.id, mockProduct.id)).rejects.toThrow(
        NotFoundException,
      );
    });

    it('should throw if cart userId mismatches', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue({ ...mockCart, userId: 'wrong-id' });
      await expect(service.addToCart(mockCart.id, mockProduct.id)).rejects.toThrow(
        ForbiddenException,
      );
    });
  });

  describe('getCartItems', () => {
    it('should return cart items with total and shipping fee', async () => {
      const cartWithItems = {
        ...mockCart,
        cartItems: [
          {
            ...mockCartItem,
            product: mockProduct,
          },
        ],
      };
      mockPrismaService.cart.findUnique.mockResolvedValue(cartWithItems);

      const result = await service.getCartItems(mockCart.id);

      expect(result.totalAmount).toBe(1000);
      expect(result.items.length).toBe(1);
      expect(result.shippingFee).toBeGreaterThanOrEqual(0);
    });
  });

  describe('updateCartItem', () => {
    it('should update the cart item quantity', async () => {
      mockPrismaService.cartItem.findUnique.mockResolvedValue(mockCartItem);
      mockPrismaService.cartItem.update.mockResolvedValue({ ...mockCartItem, quantity: 2 });

      const result = await service.updateCartItem(mockCart.id, mockCartItem.id, 2);
      expect(result.quantity).toBe(2);
    });
  });

  describe('deleteCartItems', () => {
    it('should delete selected items from cart', async () => {
      mockPrismaService.cart.findUnique.mockResolvedValue(mockCart);
      mockPrismaService.cartItem.deleteMany.mockResolvedValue({ count: 1 });

      const result = await service.deleteCartItems(mockCart.id, [mockCartItem.id]);
      expect(result.message).toContain('1개의');
    });
  });
});
