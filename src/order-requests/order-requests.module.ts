import { Module } from '@nestjs/common';
import { OrderRequestsService } from './order-requests.service';
import { OrderRequestsController } from './order-requests.controller';
import { AuthModule } from '../auth/auth.module'; // AuthModule 추가

@Module({
  imports: [AuthModule], // AuthModule을 imports에 추가
  controllers: [OrderRequestsController],
  providers: [OrderRequestsService],
})
export class OrderRequestsModule {}
