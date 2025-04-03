import { Controller, Get, Param } from '@nestjs/common';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { User } from '@prisma/client';
import { GetUser } from '@src/shared/decorators/get-user.decorator';
import { UserResponseDto } from './dto/response-user.dto';
import { GetMeResponseDto } from './dto/user.dto';
import { UsersService } from './users.service';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  // TODO: /users (GET) 회원 목록 조회
  // TODO: /users?search=김스낵 (GET) 회원 검색
  // TODO: /users/me (GET) 유저 정보 조회(본인 정보 조회)
  @Get('me')
  public async getMe(@GetUser() user: User): Promise<GetMeResponseDto> {
    return this.usersService.getMe(user.id);
  }

  // TODO: /users/{userId} (GET) 특정 유저 정보 조회
  @Get(':userId')
  @ApiOperation({
    summary: '유저 정보 조회',
    description: '유저 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '유저 정보 전달' })
  public async getUser(@Param('userId') userId: string): Promise<UserResponseDto> {
    return await this.usersService.getUser(userId);
  }

  // TODO: /users/{userId} (PUT/PATCH) 유저 정보 수정(유저 본인 정보 수정)
  // TODO: /users/{userId}/role (PATCH) [최고관리자] 유저 권한 수정
  // TODO: /users/{userId} (DELETE) 유저 정보 삭제(회원 탈퇴, 본인의 회원 탈퇴 또는 최고관리자가 탈퇴 처리)
}
