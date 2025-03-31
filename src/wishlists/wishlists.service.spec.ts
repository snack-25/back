import { Test, TestingModule } from '@nestjs/testing';
import { WishlistsService } from './wishlists.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { CartsService } from '@src/carts/carts.service';

const userId = 'xcl94l94lyb6dqceqi71r7z3';
const cartId = 'test-cart-id';
const productIds = ['product-1', 'product-2'];
const mockWishlist = productIds.map(id => ({ productId: id }));

const mockPrismaService = {
  wishlist: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    delete: jest.fn(),
    create: jest.fn(),
    deleteMany: jest.fn(),
  },
  $transaction: jest
    .fn()
    .mockImplementation(
      async <T>(fn: (tx: PrismaService) => Promise<T>) =>
        await fn(mockPrismaService as unknown as PrismaService),
    ),
};

const mockCartsService = {
  getCartByUserId: jest.fn(),
  getCartProductIds: jest.fn(),
  addProductsToCart: jest.fn(),
};

describe('WishlistsService', () => {
  let service: WishlistsService;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [
        WishlistsService,
        { provide: PrismaService, useValue: mockPrismaService },
        { provide: CartsService, useValue: mockCartsService },
      ],
    }).compile();

    service = module.get<WishlistsService>(WishlistsService);
    jest.clearAllMocks();
  });

  describe('getWishlist', () => {
    it('should return productIds from wishlist', async () => {
      mockPrismaService.wishlist.findMany.mockResolvedValue(mockWishlist);

      const result = await service.getWishlist(userId);

      expect(mockPrismaService.wishlist.findMany).toHaveBeenCalledWith({
        where: { userId },
        select: { productId: true },
      });
      expect(result).toEqual(productIds);
    });
  });

  describe('toggleWishlist', () => {
    it('should remove item if already in wishlist', async () => {
      const productId = 'product-1';
      mockPrismaService.wishlist.findUnique.mockResolvedValue({ productId });

      const result = await service.toggleWishlist(userId, productId);

      expect(mockPrismaService.wishlist.delete).toHaveBeenCalledWith({
        where: { userId_productId: { userId, productId } },
      });
      expect(result).toEqual({ message: '찜이 취소되었습니다.' });
    });

    it('should add item if not in wishlist', async () => {
      const productId = 'product-2';
      mockPrismaService.wishlist.findUnique.mockResolvedValue(null);

      const result = await service.toggleWishlist(userId, productId);

      expect(mockPrismaService.wishlist.create).toHaveBeenCalledWith({
        data: { userId, productId },
      });
      expect(result).toEqual({ message: '찜 목록에 추가되었습니다.' });
    });
  });

  describe('moveWishlistToCart', () => {
    it('should return early if productIds is empty', async () => {
      const result = await service.moveWishlistToCart(userId, []);
      expect(result).toEqual({ message: '이동할 상품이 없습니다.' });
    });

    it('should return if all products already in cart', async () => {
      mockCartsService.getCartByUserId.mockResolvedValue({ id: cartId });
      mockCartsService.getCartProductIds.mockResolvedValue(productIds);

      const result = await service.moveWishlistToCart(userId, productIds);
      expect(result).toEqual({ message: '상품이 이미 장바구니에 존재합니다.' });
    });

    it('should move products to cart and delete from wishlist', async () => {
      mockCartsService.getCartByUserId.mockResolvedValue({ id: cartId });
      mockCartsService.getCartProductIds.mockResolvedValue(['product-2']);
      mockCartsService.addProductsToCart.mockResolvedValue({ count: 1 });

      const result = await service.moveWishlistToCart(userId, productIds);

      expect(mockCartsService.addProductsToCart).toHaveBeenCalledWith(cartId, ['product-1']);
      expect(mockPrismaService.wishlist.deleteMany).toHaveBeenCalledWith({
        where: { userId, productId: { in: ['product-1'] } },
      });
      expect(result).toEqual({ message: '1개의 상품이 장바구니로 이동되었습니다.' });
    });
  });
});
