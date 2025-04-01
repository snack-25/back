import { Test, TestingModule } from '@nestjs/testing';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';
import { AuthService } from '@src/auth/auth.service';
import { ToggleWishlistDto, MoveToCartDto } from './dto/create-wishlist.dto';
import { Request } from 'express';

describe('WishlistsController', () => {
  let controller: WishlistsController;
  let service: WishlistsService;
  let authService: AuthService;

  const userId = 'xcl94l94lyb6dqceqi71r7z3';

  const mockWishlist = ['product-1', 'product-2'];
  const mockToggleDto: ToggleWishlistDto = { productId: 'product-1' };
  const mockMoveDto: MoveToCartDto = { productIds: ['product-1', 'product-2'] };

  const mockToggleResponse = { message: '찜 목록에 추가되었습니다.' };
  const mockMoveResponse = { message: '2개의 상품이 장바구니로 이동되었습니다.' };

  const mockWishlistsService = {
    getWishlist: jest.fn(),
    toggleWishlist: jest.fn(),
    moveWishlistToCart: jest.fn(),
  };

  const mockAuthService = {
    getUserFromCookie: jest.fn(),
  };

  const mockRequest = (): Partial<Request> => ({
    cookies: {
      accessToken: 'mock-token',
    },
  });

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistsController],
      providers: [
        {
          provide: WishlistsService,
          useValue: mockWishlistsService,
        },
        {
          provide: AuthService,
          useValue: mockAuthService,
        },
      ],
    }).compile();

    controller = module.get<WishlistsController>(WishlistsController);
    service = module.get<WishlistsService>(WishlistsService);
    authService = module.get<AuthService>(AuthService);

    jest.clearAllMocks();
  });

  describe('getWishlist', () => {
    it('should return wishlist product IDs', async () => {
      jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: userId, exp: Date.now() + 10000 });

      const spy = jest.spyOn(service, 'getWishlist').mockResolvedValue(mockWishlist);

      const req = mockRequest() as Request;
      const result = await controller.getWishlist(req);

      expect(spy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('toggleWishlist', () => {
    it('should toggle wishlist status', async () => {
      jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: userId, exp: Date.now() + 10000 });

      const spy = jest.spyOn(service, 'toggleWishlist').mockResolvedValue(mockToggleResponse);

      const req = mockRequest() as Request;
      const result = await controller.toggleWishlist(mockToggleDto, req);

      expect(spy).toHaveBeenCalledWith(userId, mockToggleDto.productId);
      expect(result).toEqual(mockToggleResponse);
    });
  });

  describe('moveToCart', () => {
    it('should move wishlist products to cart', async () => {
      jest
        .spyOn(authService, 'getUserFromCookie')
        .mockResolvedValue({ sub: userId, exp: Date.now() + 10000 });

      const spy = jest.spyOn(service, 'moveWishlistToCart').mockResolvedValue(mockMoveResponse);

      const req = mockRequest() as Request;
      const result = await controller.moveToCart(mockMoveDto, req);

      expect(spy).toHaveBeenCalledWith(userId, mockMoveDto.productIds);
      expect(result).toEqual(mockMoveResponse);
    });
  });
});
