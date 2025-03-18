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
  Req,
  UnauthorizedException,
} from '@nestjs/common';
import { OrderRequestStatus, UserRole } from '@prisma/client';
import type { Request } from 'express';
import { ApproveOrderRequestDto } from './dto/approve-order-requests.dto';
import { CreateOrderRequestDto } from './dto/create-order-requests.dto';
import { RejectOrderRequestDto } from './dto/reject-order-requests.dto';
import { OrderRequestsService } from './order-requests.service';

@Controller('order-requests')
export class OrderRequestsController {
  public constructor(private readonly orderRequestsService: OrderRequestsService) {}

  //TODO: /order-requests (GET) 주문 요청 목록 조회
  @Get()
  public async getOrderRequests(@Req() req: Request) {
    const user = req.user as { id: string; role: UserRole; companyId: string }; // 타입 캐스팅

    if (!user) {
      throw new UnauthorizedException('인증되지 않은 사용자입니다.');
    }

    // ✅ 일반 사용자: 본인의 `userId`를 기준으로 구매 요청 내역 조회
    if (user.role === UserRole.USER) {
      return this.orderRequestsService.getUserOrderRequests(user.id);
    }

    // ✅ 관리자 & 최고 관리자: 로그인한 사용자의 `companyId`를 사용하여 구매 요청 내역 조회
    if (user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN) {
      return this.orderRequestsService.getCompanyOrderRequests(user.companyId);
    }

    throw new UnauthorizedException('인증되지 않은 사용자입니다.');
  }

  //TODO: /order-requests (POST) 주문 요청 생성
  @Post()
  public async createOrderRequest(@Req() req: Request, @Body() dto: CreateOrderRequestDto) {
    const user = req.user as { id: string; role: UserRole; companyId: string };

    if (!user) {
      throw new UnauthorizedException('인증되지 않은 사용자입니다.');
    }

    dto.requesterId = user.id;
    dto.companyId = user.companyId;

    // 역할에 따라 상태 설정
    dto.status =
      user.role === UserRole.ADMIN || user.role === UserRole.SUPERADMIN
        ? OrderRequestStatus.APPROVED
        : OrderRequestStatus.PENDING;

    return this.orderRequestsService.createOrderRequest(dto);
  }

  //TODO: /order-requests/{orderRequestId} (GET) 주문 요청 상세 조회
  @Get(':orderRequestId')
  public async getOrderRequestDetail(
    @Param('orderRequestId') orderRequestId: string,
  ): Promise<unknown> {
    return this.orderRequestsService.getOrderRequestDetail(orderRequestId);
  }

  //TODO: /order-requests/{orderRequestId}/accept (POST) 주문 요청 승인
  @Post(':orderRequestId/accept')
  public async approveOrderRequest(
    @Req() req: Request,
    @Param('orderRequestId') orderRequestId: string,
    @Body() dto: ApproveOrderRequestDto,
  ): Promise<unknown> {
    const user = req.user as { id: string; role: UserRole; companyId: string };

    if (!user) {
      throw new UnauthorizedException('인증되지 않은 사용자입니다.');
    }

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

  //TODO: /order-requests/{orderRequestId}/reject (POST) 주문 요청 반려
  @Post(':orderRequestId/reject')
  public async rejectOrderRequest(
    @Req() req: Request,
    @Param('orderRequestId') orderRequestId: string,
    @Body() dto: RejectOrderRequestDto,
  ): Promise<unknown> {
    const user = req.user as { id: string; role: UserRole; companyId: string }; // 요청 보낸 사용자 정보

    if (!user) {
      throw new UnauthorizedException('인증되지 않은 사용자입니다.');
    }

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

  //TODO: /order-requests/{orderRequestId} (DELETE) 주문 요청 취소
  @Delete(':orderRequestId')
  async deleteOrderRequest(@Req() req, @Param('orderRequestId') orderRequestId: string) {
    const user = req.user as { id: string; role: UserRole; companyId: string };
    
    if (!user) {
      throw new UnauthorizedException('인증되지 않은 사용자입니다.');
    }

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

    // 주문 요청과 아이템을 트랜잭션으로 삭제
    await this.orderRequestsService.deleteRequestAndItemsInTransaction(orderRequestId);

    return { message: '주문 요청이 삭제되었습니다.' };
  }
}
