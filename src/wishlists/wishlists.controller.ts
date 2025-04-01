import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { MoveToCartDto, ToggleWishlistDto } from './dto/create-wishlist.dto';
import { ApiTags, ApiOperation, ApiBody } from '@nestjs/swagger';
import { Request } from 'express';
import { AuthService } from '@src/auth/auth.service';
import { AuthGuard } from '@src/auth/auth.guard';

@UseGuards(AuthGuard)
@ApiTags('Wishlists')
@Controller('wishlists')
export class WishlistsController {
  public constructor(
    private readonly wishlistsService: WishlistsService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: '찜한 상품 목록 조회' })
  @Get()
  public async getWishlist(@Req() req: Request): Promise<string[]> {
    const { sub: userId } = await this.authService.getUserFromCookie(req);
    return await this.wishlistsService.getWishlist(userId);
  }

  @ApiOperation({ summary: '찜하기 / 찜 취소' })
  @Post()
  public async toggleWishlist(
    @Body() { productId }: ToggleWishlistDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const { sub: userId } = await this.authService.getUserFromCookie(req);
    return await this.wishlistsService.toggleWishlist(userId, productId);
  }

  @Post('move-to-cart')
  @ApiOperation({ summary: '찜한 상품을 장바구니로 이동' })
  @ApiBody({ type: MoveToCartDto })
  public async moveToCart(
    @Body() { productIds }: MoveToCartDto,
    @Req() req: Request,
  ): Promise<{ message: string }> {
    const { sub: userId } = await this.authService.getUserFromCookie(req);
    return await this.wishlistsService.moveWishlistToCart(userId, productIds);
  }
}
