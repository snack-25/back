import { Module } from '@nestjs/common';
import { CartsService } from './carts.service';
import { CartsController } from './carts.controller';
import { PrismaModule } from '@src/shared/prisma/prisma.module';
import { AuthModule } from '@src/auth/auth.module';

@Module({
  imports: [PrismaModule, AuthModule],
  controllers: [CartsController],
  providers: [CartsService],
  exports: [CartsService],
})
export class CartsModule {}
