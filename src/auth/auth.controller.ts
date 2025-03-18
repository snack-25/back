import { Controller, Body, Post, Req, Res, UseGuards, BadRequestException } from '@nestjs/common';
import { AuthService } from './auth.service';
import { SignUpRequestDto, SignInRequestDto } from './dto/auth.dto';
import { Request, Response } from 'express';

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
  public async login(
    @Body() dto: SignInRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // console.log('????');
    // console.log('dto', dto);
    console.log('Cookies:', req.cookies);
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

// 로그인 과정 (전체 흐름)
// ✅ 1. 프론트에서 로그인 요청 보냄 (POST /auth/login)
// ✅ 2. 백엔드에서 이메일/비밀번호 검증 후 Access Token, Refresh Token 생성
// ✅ 3. Access Token은 JSON으로 응답하고, Refresh Token은 HttpOnly 쿠키로 설정
// ✅ 4. 이후 API 요청 시 브라우저가 Refresh Token을 자동으로 포함하여 보냄
// ✅ 5. Access Token이 만료되면 Refresh Token을 사용하여 새로운 Access Token을 발급받음
