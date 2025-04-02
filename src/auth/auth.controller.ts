import {
  Body,
  Controller,
  // Get,
  HttpCode,
  HttpStatus,
  Post,
  Req,
  Res,
  Param,
  // UseGuards,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { type Invitation } from '@prisma/client';
import { Request, Response } from 'express';
// import { AuthGuard } from './auth.guard';
import { AuthService } from './auth.service';
import {
  InvitationCodeDto,
  SignInRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
  TokenResponseDto,
} from './dto/auth.dto';

@Controller('auth')
export class AuthController {
  public constructor(private readonly authService: AuthService) {}

  // TODO: /auth/signup (POST) [최고관리자] 회원가입

  @Post('signup')
  @ApiOperation({
    summary: '회원가입',
    description: '회원가입',
  })
  @ApiResponse({
    status: 201,
    description: '회원가입이 완료되었습니다.',
  })
  @ApiResponse({
    status: 409,
    description: '이미 사용 중인 이메일입니다.',
  })
  @ApiResponse({
    status: 500,
    description: '회원가입을 진행하는 중 오류가 발생했습니다.',
  })
  @HttpCode(HttpStatus.CREATED)
  public async signup(@Body() dto: SignUpRequestDto, @Res() res: Response): Promise<void> {
    const result = await this.authService.signup(dto);
    res.status(201).json({ msg: '회원가입에 성공했습니다.', data: result });
  }

  @Post('signup/invitationcode')
  @ApiOperation({
    summary: '초대 토큰 정보 조회',
    description: '초대 토큰 정보 조회',
  })
  @ApiResponse({ status: 200, description: '토큰 유저 정보 전달' })
  public async signupInfo(@Body() body: InvitationCodeDto): Promise<Invitation | null> {
    return await this.authService.getinfo(body);
  }

  @Post('signup/invite/:token')
  @ApiOperation({
    summary: '초대 토큰으로 회원가입',
    description: '초대 토큰으로 회원가입',
  })
  @ApiResponse({ status: 200, description: '회원가입에 성공했습니다' })
  @ApiResponse({ status: 400, description: '유효하지 않은 초대 토큰입니다.' })
  @ApiResponse({ status: 500, description: '회원가입 처리 중 문제가 발생했습니다.' })
  public async signupToken(
    @Param('token') token: string,
    @Body() body: { password: string },
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const user = await this.authService.getinfo({ token: req.params.token });

    if (!user) {
      res.status(400).json({ ok: false, message: '유효하지 않은 초대 토큰입니다.' });
    }
    const password = body.password;

    const result: SignUpResponseDto | null = await this.authService.invitationSignup({
      password,
      token,
    });

    if (!result) {
      res.status(500).json({ ok: false, message: '회원가입 처리 중 문제가 발생했습니다.' });
      return;
    }

    res.status(200).json({ ok: true, message: '회원가입에 성공했습니다' });
  }

  @Post('login')
  @ApiOperation({
    summary: '유저 로그인',
    description:
      '모든 테스트용 계정(user1~5,admin1~2,superadmin1)의 비밀번호는 아이디(user1)과 동일합니다',
  })
  public async login(
    @Body() dto: SignInRequestDto,
    @Req() req: Request,
    @Res() res: Response,
  ): Promise<void> {
    const loginResult = await this.authService.login(dto);

    if (!loginResult) {
      throw new Error('로그인 실패: 응답이 없습니다.');
    }

    const { token, user } = loginResult;

    // 쿠키 인증 설정
    this.setAuthCookies(res, token);

    res.status(200).json({ msg: '로그인 성공', data: user });
  }

  @Post('logout')
  @ApiOperation({
    summary: '유저 로그아웃',
    description: '유저 로그아웃',
  })
  public async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const invalidateToken = req.cookies['refreshToken'];

    if (!invalidateToken) {
      res.status(400).json({ message: 'Refresh Token이 없습니다.' });
      return;
    }

    await this.authService.logout(invalidateToken, res);
  }

  private setAuthCookies(@Res() res: Response, token: TokenResponseDto): void {
    res.cookie('accessToken', token.accessToken, {
      httpOnly: true, // XSS 공격 방지
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict', // CORS 문제 방지
      maxAge: 1000 * 60 * 60 * 24, // 24시간 (24시간 × 60분 × 60초 × 1000밀리초)
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
  // @UseGuards(AuthGuard)
  // @Get('guard')
  // public findAll(): string {
  //   return 'guard';
  // }
}
