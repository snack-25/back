import { Controller, Post, Body } from '@nestjs/common';
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

  // POST /auth/invite - 관리자 초대 기능
  @Post('invite')
  async inviteUser(@Body() dto: InviteUserDto) {
    return this.authService.inviteUser(dto);
  }

  // TODO: /auth/login (POST) 로그인
  // TODO: /auth/logout (POST) 로그아웃
  // TODO: /auth/refresh (POST) 토큰 재발급
}
