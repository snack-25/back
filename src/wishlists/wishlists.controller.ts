import { Controller, Get, Post, Body } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { MoveToCartDto, ToggleWishlistDto } from './dto/create-wishlist.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';

@ApiTags('Wishlists')
@Controller('wishlists')
export class WishlistsController {
  public constructor(private readonly wishlistsService: WishlistsService) {}

  @ApiOperation({ summary: '찜한 상품 목록 조회' })
  @Get()
  public async getWishlist(): Promise<string[]> {
    const userId = 'xcl94l94lyb6dqceqi71r7z3'; // 테스트용 고정 userId
    return await this.wishlistsService.getWishlist(userId);
  }

  @ApiOperation({ summary: '찜하기 / 찜 취소' })
  @Post()
  public async toggleWishlist(
    @Body() { productId }: ToggleWishlistDto,
  ): Promise<{ message: string }> {
    const userId = 'xcl94l94lyb6dqceqi71r7z3'; // 테스트용 고정 userId
    return await this.wishlistsService.toggleWishlist(userId, productId);
  }

  @Post('move-to-cart')
  @ApiOperation({ summary: '찜한 상품을 장바구니로 이동' })
  @ApiBody({ type: MoveToCartDto })
  public async moveToCart(@Body() { productIds }: MoveToCartDto): Promise<{ message: string }> {
    const userId = 'xcl94l94lyb6dqceqi71r7z3'; // 테스트용 고정 userId
    return await this.wishlistsService.moveWishlistToCart(userId, productIds);
  }
}
