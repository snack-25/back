import { Body, Controller, Get, Param, Post, Query } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiQuery, ApiParam, ApiBody } from '@nestjs/swagger';
import { OrderRequestDto } from './dto/create-order.dto';
import { Order } from '@prisma/client';
import { OrderQueryDto } from './dto/update-order.dto';
import { OrdersService } from './orders.service';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  public constructor(private readonly ordersService: OrdersService) {}

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
    @Query() query: OrderQueryDto,
    @Query('page') page: string = '1',
    @Query('pageSize') pageSize: string = '6',
    @Query('sort') sort: string = 'latest',
  ): Promise<{ orders: Order[]; totalOrders: number; totalPages: number }> {
    const userId = '11';
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
  public async adminPurchase(@Body() orderData: OrderRequestDto): Promise<Order> {
    const userId = '11';
    return await this.ordersService.createOrder(userId, orderData);
  }

  @ApiOperation({
    summary: '주문 상세 조회',
    description: '주문 ID를 기반으로 주문 상세 정보를 조회합니다.',
  })
  @ApiParam({ name: 'orderId', required: true, description: '조회할 주문의 ID' })
  @ApiResponse({ status: 200, description: '주문 상세 조회 성공' })
  @Get(':orderId')
  public async getOrderDetail(
    @Param('orderId') orderId: string,
  ): Promise<{ order: Order; totalItems: number }> {
    const userId = '11';
    return await this.ordersService.getOrderDetail(userId, orderId);
  }
}
