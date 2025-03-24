import { Controller, Post, Body, Req } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { SignUpRequestDto } from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // POST /auth/signup - 최고관리자 회원가입
  @Post('signup')
  async signup(@Body() dto: SignUpRequestDto) {
    return this.authService.signup(dto);
  }

  /* 로그인 구현 후 JWT에서 유저 정보 추출
  // POST /auth/invite - 관리자 초대 기능
  @UseGuards(AuthGuard('jwt'))
  @Post('invite')
  async inviteUser(@Body() dto: InviteUserDto, @User() user: AuthUser) {
    return this.authService.inviteUser(dto, user);
  }
*/
  // POST /auth/invite - 관리자 초대 기능. 테스트용 (로그인 없이)
  @Post('invite')
  async inviteUser(@Body() dto: InviteUserDto, @Req() req: Request) {
    const fakeUser = {
      id: 'aetqn2jftkh2aqgdko9nf3ps', // 초대 관리자 ID
      companyId: 'aetqn2jftkh2aqgdko9nf3ps', // 초대 관리자 회사 ID
    };

    return this.authService.inviteUser(dto, fakeUser);
  }

  // TODO: /auth/login (POST) 로그인
  // TODO: /auth/logout (POST) 로그아웃
  // TODO: /auth/refresh (POST) 토큰 재발급
}
