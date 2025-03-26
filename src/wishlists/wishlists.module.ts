import { Module } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { WishlistsController } from './wishlists.controller';
import { CartsService } from '@src/carts/carts.service';

@Module({
  imports: [PrismaModule, CartsService],
  controllers: [WishlistsController],
  providers: [WishlistsService],
})
export class WishlistsModule {}
