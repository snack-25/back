import { Module } from '@nestjs/common';
import { WishlistService } from './wishlist.service';
import { WishlistController } from './wishlist.controller';
import { PrismaModule } from '../shared/prisma/prisma.module';

@Module({
  imports: [PrismaModule],
  controllers: [WishlistController],
  providers: [WishlistService],
})
export class WishlistModule {}
