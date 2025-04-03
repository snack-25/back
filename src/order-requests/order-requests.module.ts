import { Module } from '@nestjs/common';
import { AuthModule } from '../auth/auth.module'; // AuthModule 추가
import { OrderRequestsController } from './order-requests.controller';
import { OrderRequestsService } from './order-requests.service';

@Module({
  imports: [AuthModule], // AuthModule을 imports에 추가
  controllers: [OrderRequestsController],
  providers: [OrderRequestsService],
})
export class OrderRequestsModule {}
