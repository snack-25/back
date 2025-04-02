import {
  BadRequestException,
  Body,
  Controller,
  Delete,
  ForbiddenException,
  Get,
  NotFoundException,
  Param,
  Post,
  Query,
  Req,
  UnauthorizedException,
  UseGuards,
} from '@nestjs/common';
import { OrderRequestStatus, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { ApiTags, ApiOperation, ApiResponse, ApiParam, ApiBody, ApiQuery } from '@nestjs/swagger';
import { ApproveOrderRequestDto } from './dto/approve-order-request.dto';
import { CreateOrderRequestDto } from './dto/create-order-request.dto';
import { RejectOrderRequestDto } from './dto/reject-order-request.dto';
import { GetOrderRequestsDto, OrderSort } from './dto/getOrderRequest.dto';
import { OrderRequestsService } from './order-requests.service';
import { AuthGuard } from '@src/auth/auth.guard'; // 인증 가드 추가
import { AuthService } from '@src/auth/auth.service'; // AuthService 가져오기
import { PrismaService } from '@src/shared/prisma/prisma.service'; // PrismaService 가져오기

@ApiTags('OrderRequests') // Swagger 그룹 태그 추가
@UseGuards(AuthGuard) // 인증 가드 적용
@Controller('order-requests')
export class OrderRequestsController {
  public constructor(
    private readonly orderRequestsService: OrderRequestsService,
    private readonly authService: AuthService, // AuthService 주입
    private readonly prismaService: PrismaService, // PrismaService 주입
  ) {}

  // getUserFromCookie 메서드를 authService에서 가져와 사용
  private async getUserFromCookie(@Req() req: Request) {
    const decoded = await this.authService.getUserFromCookie(req); // authService에서 유저 정보를 가져옵니다.
    
    // 유저 정보에서 ID를 가져와서 Prisma로 유저를 조회
    const user = await this.prismaService.user.findUnique({
      where: { id: decoded.sub },
    });

    // 유저가 존재하지 않으면 예외 처리
    if (!user) {
      throw new UnauthorizedException('사용자를 찾을 수 없습니다.');
    }

    return user; // 반환된 유저 객체에는 role과 companyId가 포함됩니다.
  }

  @ApiOperation({ summary: '주문 요청 목록 조회' })
  @ApiResponse({ status: 200, description: '주문 요청 목록 반환' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @ApiQuery({
    name: 'page',
    required: false,
    type: Number,
    example: 1,
    description: '페이지 번호',
  })
  @ApiQuery({
    name: 'pageSize',
    required: false,
    type: Number,
    example: 6,
    description: '페이지당 항목 개수',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: OrderSort,
    example: 'latest',
    description: '정렬 기준 (latest: 최신순, lowPrice: 낮은 가격순, highPrice: 높은 가격순)',
  })
  @Get()
  public async getOrderRequests(@Req() req: Request, @Query() query: GetOrderRequestsDto) {
    const user = await this.getUserFromCookie(req); // 유저 정보를 가져옵니다.

    const { page = 1, pageSize = 10, sort = OrderSort.LATEST } = query;

    if (user.role === UserRole.USER) {
      return this.orderRequestsService.getUserOrderRequests(user.id, page, pageSize.toString(), sort);
    }

    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
      return this.orderRequestsService.getCompanyOrderRequests(
        user.companyId,
        page,
        pageSize.toString(),
        sort,
      );
    }

    throw new UnauthorizedException('인증되지 않은 사용자입니다.');
  }

  @ApiOperation({ summary: '주문 요청 생성' })
  @ApiBody({ type: CreateOrderRequestDto })
  @ApiResponse({ status: 201, description: '주문 요청 생성 성공' })
  @ApiResponse({ status: 401, description: '인증되지 않은 사용자' })
  @Post()
  public async createOrderRequest(@Req() req: Request, @Body() dto: CreateOrderRequestDto) {
    const user = await this.getUserFromCookie(req); // 유저 정보를 가져옵니다.

    dto.requesterId = user.id;
    dto.companyId = user.companyId;
    dto.status =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN
        ? OrderRequestStatus.APPROVED
        : OrderRequestStatus.PENDING;

    return this.orderRequestsService.createOrderRequest(dto);
  }

  @ApiOperation({ summary: '주문 요청 상세 조회' })
  @ApiParam({ name: 'orderRequestId', description: '조회할 주문 요청 ID' })
  @ApiResponse({ status: 200, description: '주문 요청 상세 정보 반환' })
  @ApiResponse({ status: 404, description: '주문 요청을 찾을 수 없음' })
  @Get(':orderRequestId')
  public async getOrderRequestDetail(@Param('orderRequestId') orderRequestId: string) {
    return this.orderRequestsService.getOrderRequestDetail(orderRequestId);
  }

  @ApiOperation({ summary: '주문 요청 승인' })
  @ApiParam({ name: 'orderRequestId', description: '승인할 주문 요청 ID' })
  @ApiBody({ type: ApproveOrderRequestDto })
  @ApiResponse({ status: 200, description: '주문 요청 승인 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '주문 요청을 찾을 수 없음' })
  @Post(':orderRequestId/accept')
  public async approveOrderRequest(
    @Req() req: Request,
    @Param('orderRequestId') orderRequestId: string,
    @Body() dto: ApproveOrderRequestDto,
  ) {
    const user = await this.getUserFromCookie(req); // 유저 정보를 가져옵니다.

    if (user.role === UserRole.USER) {
      throw new ForbiddenException('일반 사용자는 구매 요청을 승인할 수 없습니다.');
    }

    const orderRequest = await this.orderRequestsService.getOrderRequestById(orderRequestId);
    if (!orderRequest) {
      throw new NotFoundException('구매 요청을 찾을 수 없습니다.');
    }

    return this.orderRequestsService.approveOrderRequest(orderRequestId, {
      ...dto,
      resolverId: user.id,
    });
  }

  @ApiOperation({ summary: '주문 요청 반려' })
  @ApiParam({ name: 'orderRequestId', description: '반려할 주문 요청 ID' })
  @ApiBody({ type: RejectOrderRequestDto })
  @ApiResponse({ status: 200, description: '주문 요청 반려 성공' })
  @ApiResponse({ status: 403, description: '권한 없음' })
  @ApiResponse({ status: 404, description: '주문 요청을 찾을 수 없음' })
  @Post(':orderRequestId/reject')
  public async rejectOrderRequest(
    @Req() req: Request,
    @Param('orderRequestId') orderRequestId: string,
    @Body() dto: RejectOrderRequestDto,
  ) {
    const user = await this.getUserFromCookie(req); // 유저 정보를 가져옵니다.

    if (user.role === UserRole.USER) {
      throw new ForbiddenException('일반 사용자는 구매 요청을 거절할 수 없습니다.');
    }

    const orderRequest = await this.orderRequestsService.getOrderRequestById(orderRequestId);
    if (!orderRequest) {
      throw new NotFoundException('구매 요청을 찾을 수 없습니다.');
    }

    return this.orderRequestsService.rejectOrderRequest(orderRequestId, {
      ...dto,
      resolverId: user.id,
    });
  }

  @ApiOperation({ summary: '주문 요청 삭제' })
  @ApiParam({ name: 'orderRequestId', description: '삭제할 주문 요청 ID' })
  @ApiResponse({ status: 200, description: '주문 요청 삭제 성공' })
  @ApiResponse({ status: 403, description: '본인이 생성한 요청만 삭제 가능' })
  @ApiResponse({ status: 400, description: '이미 처리된 주문 요청은 삭제할 수 없음' })
  @Delete(':orderRequestId')
  public async deleteRequestAndItemsInTransaction(
    @Req() req: Request,
    @Param('orderRequestId') orderRequestId: string,
  ): Promise<{ message: string }> {
    const user = await this.getUserFromCookie(req); // 유저 정보를 가져옵니다.

    const orderRequest = await this.orderRequestsService.getOrderRequestById(orderRequestId);
    if (!orderRequest) {
      throw new NotFoundException('주문 요청을 찾을 수 없습니다.');
    }

    if (orderRequest.requesterId !== user.id) {
      throw new ForbiddenException('본인이 생성한 주문 요청만 삭제할 수 있습니다.');
    }

    if (orderRequest.status !== OrderRequestStatus.PENDING) {
      throw new BadRequestException('이미 처리된 주문 요청은 삭제할 수 없습니다.');
    }

    await this.orderRequestsService.deleteRequestAndItemsInTransaction(orderRequestId);
    return { message: '주문 요청이 삭제되었습니다.' };
  }
}
