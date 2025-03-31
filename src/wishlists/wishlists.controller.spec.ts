import { Test, TestingModule } from '@nestjs/testing';
import { WishlistsController } from './wishlists.controller';
import { WishlistsService } from './wishlists.service';
import { ToggleWishlistDto, MoveToCartDto } from './dto/create-wishlist.dto';

describe('WishlistsController', () => {
  let controller: WishlistsController;
  let service: WishlistsService;

  const userId = 'xcl94l94lyb6dqceqi71r7z3';

  const mockWishlist = ['product-1', 'product-2'];
  const mockToggleWishlistDto: ToggleWishlistDto = { productId: 'product-1' };
  const mockMoveToCartDto: MoveToCartDto = { productIds: ['product-1', 'product-2'] };

  const mockWishlistMessage = { message: '찜 목록에 추가되었습니다.' };
  const mockMoveMessage = { message: '2개의 상품이 장바구니로 이동되었습니다.' };

  const mockWishlistsService = {
    getWishlist: jest.fn(),
    toggleWishlist: jest.fn(),
    moveWishlistToCart: jest.fn(),
  };

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      controllers: [WishlistsController],
      providers: [
        {
          provide: WishlistsService,
          useValue: mockWishlistsService,
        },
      ],
    }).compile();

    controller = module.get<WishlistsController>(WishlistsController);
    service = module.get<WishlistsService>(WishlistsService);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getWishlist', () => {
    it('should return wishlist product IDs', async () => {
      const spy = jest.spyOn(service, 'getWishlist').mockResolvedValue(mockWishlist);

      const result = await controller.getWishlist();
      expect(spy).toHaveBeenCalledWith(userId);
      expect(result).toEqual(mockWishlist);
    });
  });

  describe('toggleWishlist', () => {
    it('should toggle wishlist status', async () => {
      const spy = jest.spyOn(service, 'toggleWishlist').mockResolvedValue(mockWishlistMessage);

      const result = await controller.toggleWishlist(mockToggleWishlistDto);
      expect(spy).toHaveBeenCalledWith(userId, mockToggleWishlistDto.productId);
      expect(result).toEqual(mockWishlistMessage);
    });
  });

  describe('moveToCart', () => {
    it('should move wishlist products to cart', async () => {
      const spy = jest.spyOn(service, 'moveWishlistToCart').mockResolvedValue(mockMoveMessage);

      const result = await controller.moveToCart(mockMoveToCartDto);
      expect(spy).toHaveBeenCalledWith(userId, mockMoveToCartDto.productIds);
      expect(result).toEqual(mockMoveMessage);
    });
  });
});
