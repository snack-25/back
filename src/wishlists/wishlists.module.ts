import { Module } from '@nestjs/common';
import { WishlistsService } from './wishlists.service';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { WishlistsController } from './wishlists.controller';
import { CartsModule } from '@src/carts/carts.module';
import { AuthModule } from '@src/auth/auth.module';

@Module({
  imports: [PrismaModule, CartsModule, AuthModule],
  controllers: [WishlistsController],
  providers: [WishlistsService],
})
export class WishlistsModule {}
