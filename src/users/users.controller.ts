import { Controller } from '@nestjs/common';
import { UsersService } from './users.service';

@Controller('users')
export class UsersController {
  public constructor(private readonly usersService: UsersService) {}

  // TODO: /users/{userId} (GET) 유저 정보 조회
  // TODO: /users/{userId} (PUT/PATCH) 유저 정보 수정(유저 본인 정보 수정)
  // TODO: /users/{userId}/role (PATCH) [최고관리자] 유저 권한 수정
  // TODO: /users/{userId} (DELETE) 유저 정보 삭제(회원 탈퇴, 본인의 회원 탈퇴 또는 최고관리자가 탈퇴 처리)
}
