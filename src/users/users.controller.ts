import { Controller, Get, Param } from '@nestjs/common';
import { UsersService } from './users.service';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';
import { UserResponseDto } from './dto/response-user.dto';

@ApiBearerAuth()
@Controller('users')
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  // TODO: /users/{userId} (GET) 유저 정보 조회
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
