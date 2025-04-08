import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ApiOperation, ApiResponse } from '@nestjs/swagger';
import { type Invitation } from '@prisma/client';
import { Request, Response } from 'express';
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
    description: '사용자 정보를 입력받아 새로운 계정을 생성합니다',
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

    res.status(201).json({ message: '회원가입에 성공했습니다.', data: result });
  }

  @Post('signup/invitationcode')
  @ApiOperation({
    summary: '초대 토큰 정보 조회',
    description: '초대 토큰을 통해 초대된 사용자의 정보를 조회합니다.',
  })
  @ApiResponse({ status: 200, description: '토큰 유저 정보 전달' })
  public async signupInfo(@Body() body: InvitationCodeDto): Promise<Invitation | null> {
    return await this.authService.getinfo(body);
  }

  @Post('signup/invite/:token')
  @ApiOperation({
    summary: '초대 토큰으로 회원가입',
    description: '초대 토큰을 통해 초대된 사용자로 회원가입을 진행합니다.',
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
      res.status(400).json({ message: '유효하지 않은 초대 토큰입니다.' });
    }
    const password = body.password;

    const result: SignUpResponseDto | null = await this.authService.invitationSignup({
      password,
      token,
    });

    if (!result) {
      res.status(500).json({ message: '회원가입 처리 중 문제가 발생했습니다.' });
      return;
    }

    res.status(200).json({ message: '회원가입에 성공했습니다' });
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

    // 응답 본문에 토큰 정보 포함 (클라이언트에서 필요할 수 있음)
    res.status(200).json({
      message: '로그인에 성공하였습니다',
      data: user,
    });
  }

  @Post('logout')
  @ApiOperation({
    summary: '유저 로그아웃',
    description: '현재 로그인된 사용자의 세션을 종료하고 인증 토큰을 무효화합니다.',
  })
  public async logout(@Req() req: Request, @Res() res: Response): Promise<void> {
    const invalidateToken = req.cookies['refreshToken'] as string;

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
      sameSite: 'lax', // CORS 문제 방지 (strict에서 lax로 변경)
      maxAge: 1000 * 60 * 60 * 24, // 24시간 (24시간 × 60분 × 60초 × 1000밀리초)
      path: '/', // 모든 경로에서 접근 가능
    });

    res.cookie('refreshToken', token.refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax', // strict에서 lax로 변경
      maxAge: 60 * 1000 * 60 * 24 * 14, // 2w
      path: '/', // 모든 경로에서 접근 가능
    });
  }

  // refresh token을 이용한 access token 재발급
  @Post('refresh')
  private async refreshToken(@Req() req: Request, @Res() res: Response): Promise<void> {
    const refreshToken = req.cookies['refreshToken'] as string;
    if (!refreshToken) {
      throw new UnauthorizedException('리프레시 토큰이 필요합니다.');
    }
    // refreshToken 검증 (DB 내 저장된 토큰과 비교)
    const payload = await this.authService.verifyRefreshToken(refreshToken);
    // refreshToken 검증 성공 시, 새로운 토큰 생성
    const newTokens = await this.authService.generateToken(payload.sub);

    res.status(200).json({ token: newTokens.accessToken });
  }

  // 아래와 같이 사용하려는 API Endpoint위에 @UseGuards(AuthGuard) 데코레이터를 추가하면
  // 쿠키 기반 인증을 검사합니다. 권한이 없으면 에러를 반환합니다.
  // @UseGuards(AuthGuard)
  // @Get('guard')
  // public findAll(): string {
  //   return 'guard';
  // }
}
