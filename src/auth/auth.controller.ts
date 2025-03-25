import { Controller, Body, Post, Get, Req, Res, UseGuards } from '@nestjs/common';
import { AuthService } from './auth.service';
import {
  SignUpRequestDto,
  SignInRequestDto,
  TokenResponseDto,
  InvitationCodeDto,
} from './dto/auth.dto';
import { Request, Response } from 'express';
import { AuthGuard } from './auth.guard';
import { ApiResponse } from '@nestjs/swagger';
import { type Invitation } from '@prisma/client';

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  // TODO: /auth/signup (POST) [최고관리자] 회원가입

  @Post('signup')
  public async signup(@Body() dto: SignUpRequestDto, @Res() res: Response): Promise<void> {
    const result = await this.authService.signup(dto);
    res.status(200).json({ msg: '회원가입에 성공했습니다.', data: result });
  }

  @Post('signup/invitationcode')
  @ApiResponse({ status: 200, description: '토큰 유저 정보 전달' })
  public async signupInfo(@Body() body: InvitationCodeDto): Promise<Invitation | null> {
    console.log('body', body);
    // console.log(rep)
    return await this.authService.getinfo(body);
  }

  @Post('signup/invite/:token')
  public async signupToken(
    @Body() body: { password: string },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    await this.authService.getinfo({ token: req.params.token });
    const password = body.password;
    console.log(password);
    const result: string = await this.authService.invitationSignup({
      password,
      token: req.params.token,
    });
    res.status(200).json({ msg: result });
  }

  @Post('login')
  public async login(
    @Body() dto: SignInRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    // console.log('dto', dto);
    console.log('Cookies:', req.cookies);

    const loginResult = await this.authService.login(dto);

    if (!loginResult) {
      throw new Error('로그인 실패: 응답이 없습니다.');
    }

    const { token, user } = loginResult;

    // 쿠키 인증 설정
    this.setAuthCookies(res, token);

    res.status(200).json({ msg: '로그인 성공', data: user });
  }

  // 로그아웃
  @UseGuards(AuthGuard)
  @Post('logout')
  public async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    // console.log('req', req);
    console.log('123445435');

    const invalidateToken = req.cookies['refreshToken'];

    console.log('invalidateToken', invalidateToken);

    if (!invalidateToken) {
      res.status(400).json({ message: 'Refresh Token이 없습니다.' });
      return;
    }

    await this.authService.logout(invalidateToken, res);
  }

  // 쿠키 인증 설정(accessToken, refreshToken 둘 다 설정)
  private setAuthCookies(@Res() res: Response, token: TokenResponseDto): void {
    res.cookie('accessToken', token.accessToken, {
      httpOnly: true, // XSS 공격 방지
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // CORS 문제 방지
      maxAge: 60 * 1000 * 60 * 24, // 24시간 (24시간 × 60분 × 60초 × 1000밀리초)
    });

    res.cookie('refreshToken', token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 60 * 1000 * 60 * 24 * 14, // 2w
    });
  }

  // 아래와 같이 사용하려는 API Endpoint위에 @UseGuards(AuthGuard) 데코레이터를 추가하면
  // 쿠키 기반 인증을 검사합니다. 권한이 없으면 에러를 반환합니다.
  @UseGuards(AuthGuard)
  @Get('guard')
  public findAll(): string {
    return 'guard';
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
