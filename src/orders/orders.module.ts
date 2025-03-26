import { Module } from '@nestjs/common';
import { OrdersController } from './orders.controller';
import { OrdersService } from './orders.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { CartsService } from '@src/carts/carts.service';
import { ProductsService } from '@src/products/products.service';

@Module({
  imports: [CartsService, ProductsService],
  controllers: [OrdersController],
  providers: [OrdersService, PrismaService],
  exports: [OrdersService],
})
export class OrdersModule {}
