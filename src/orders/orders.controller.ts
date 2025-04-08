import { Body, Controller, Get, Param, Post, Query, Req } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiBody } from '@nestjs/swagger';
import { OrderRequestDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { OrderQueryDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';
import { Request } from 'express';
import { AuthService } from '@src/auth/auth.service';
import { ApiBearerAuth } from '@nestjs/swagger';
import { GetUser } from '@src/shared/decorators/get-user.decorator';
import { OrderDetailResponse } from './dto/orders.insterface';

@ApiBearerAuth()
@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  public constructor(
    private readonly ordersService: OrdersService,
    private readonly authService: AuthService,
  ) {}

  @ApiOperation({ summary: '주문 목록 조회', description: '사용자의 주문 목록을 조회합니다.' })
  @ApiQuery({ name: 'page', required: false, description: '페이지 번호 (기본값: 1)' })
  @ApiQuery({ name: 'pageSize', required: false, description: '한 페이지당 항목 수 (기본값: 6)' })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['latest', 'oldest'],
    description: '정렬 기준 (최신순, 오래된순)',
  })
  @ApiResponse({ status: 200, description: '주문 목록 조회 성공' })
  @Get()
  public async getUserOrders(
    @Req() req: Request,
    @Query() query: OrderQueryDto,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '6',
    @Query('sort') sort: string = 'latest',
  ): Promise<{ orders: Order[]; totalOrders: number; totalPages: number }> {
    const { sub: userId } = await this.authService.getUserFromCookie(req);
    const pageNumber = parseInt(page, 10);
    const pageSizeNumber = parseInt(pageSize, 10);

    return await this.ordersService.getUserOrders(userId, query, pageNumber, pageSizeNumber, sort);
  }

  @ApiOperation({
    summary: '주문 생성',
    description: '관리자 또는 최고관리자가 주문을 생성합니다.',
  })
  @ApiBody({ type: OrderRequestDto, description: '주문할 상품 목록' })
  @ApiResponse({ status: 201, description: '주문 생성 성공' })
  @Post()
  public async adminPurchase(
    @Req() req: Request,
    @Body() orderData: OrderRequestDto,
    @GetUser() user: { role: string },
  ): Promise<Order> {
    const { sub: userId } = await this.authService.getUserFromCookie(req);
    return await this.ordersService.createOrder(userId, user.role, orderData);
  }

  @ApiResponse({ status: 200, description: '주문 상세 조회 성공' })
  @Get(':orderId')
  public async getOrderDetail(
    @Req() req: Request,
    @Param('orderId') orderId: string,
  ): Promise<OrderDetailResponse> {
    const { sub: userId } = await this.authService.getUserFromCookie(req);
    return await this.ordersService.getOrderDetail(userId, orderId);
  }
}
