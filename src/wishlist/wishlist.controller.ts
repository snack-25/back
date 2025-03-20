import { Controller, Get, Post, Body } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { ToggleWishlistDto } from './dto/create-wishlist.dto';
import { ApiTags, ApiOperation } from '@nestjs/swagger';

@ApiTags('Wishlist')
@Controller('wishlist')
export class WishlistController {
  public constructor(private readonly wishlistService: WishlistService) {}

  @ApiOperation({ summary: '찜한 상품 목록 조회' })
  @Get()
  public async getWishlist(): Promise<string[]> {
    const userId = '11'; // 테스트용 고정 userId
    return await this.wishlistService.getWishlist(userId);
  }

  @ApiOperation({ summary: '찜하기 / 찜 취소' })
  @Post()
  public async toggleWishlist(
    @Body() { productId }: ToggleWishlistDto,
  ): Promise<{ message: string }> {
    const userId = '11'; // 테스트용 고정 userId
    return await this.wishlistService.toggleWishlist(userId, productId);
  }
}
