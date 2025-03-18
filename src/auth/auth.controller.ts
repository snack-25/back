import { Controller, Body, Post, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpRequestDto, SignInRequestDto } from './dto/auth.dto';
import { Response } from 'express';

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  // TODO: /auth/signup (POST) [최고관리자] 회원가입

  @Post('signup')
  public async signup(@Body() dto: SignUpRequestDto, @Res() res: Response): Promise<void> {
    const result = await this.authService.signup(dto);
    res.status(200).json({ msg: '회원가입에 성공했습니다.', data: result });
  }

  @Post('login')
  @UseGuards()
  public async login(@Body() dto: SignInRequestDto, @Res() res: Response): Promise<void> {
    // console.log('????');
    // console.log('dto', dto);
    const result = await this.authService.login(dto);
    if (!result) {
      throw new BadRequestException('이메일 또는 비밀번호를 확인해주세요.');
    }
    res.status(200).json({ msg: '로그인 성공', data: result });
  }
  // TODO: /auth/login (POST) 로그인
  // TODO: /auth/logout (POST) 로그아웃
  // TODO: /auth/refresh (POST) 토큰 재발급
}
