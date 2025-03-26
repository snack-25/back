import { Module } from '@nestjs/common';
import { ConfigModule } from '@nestjs/config';
import { AppController } from './app.controller';
import { AppService } from './app.service';
import { AuthModule } from './auth/auth.module';
import { BudgetsModule } from './budgets/budgets.module';
import { CartsModule } from './carts/carts.module';
import { CategoriesModule } from './categories/categories.module';
import { CompaniesModule } from './companies/companies.module';
import { InvitationsModule } from './invitations/invitations.module';
import { OrderRequestsModule } from './order-requests/order-requests.module';
import { OrdersModule } from './orders/orders.module';
import { ProductsModule } from './products/products.module';
// import { AwsS3Module } from './shared/aws/s3.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { UsersModule } from './users/users.module';
import { WishlistsModule } from './wishlists/wishlists.module';

@Module({
  imports: [
    ConfigModule.forRoot({
      // 전역적으로 환경변수 설정
      isGlobal: true,
      // NODE_ENV 값에 따라 환경변수 파일을 로드
      envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
    }),
    PrismaModule,
    // AwsS3Module,
    UsersModule,
    AuthModule,
    CompaniesModule,
    CartsModule,
    ProductsModule,
    CategoriesModule,
    OrdersModule,
    OrderRequestsModule,
    BudgetsModule,
    InvitationsModule,
    WishlistsModule,
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
