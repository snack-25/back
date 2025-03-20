import { Injectable, Res, BadRequestException, UnauthorizedException } from '@nestjs/common';
import { UsersService } from '../users/users.service';
import {
  SignUpComponeyRequestDto,
  SignUpRequestDto,
  SignInRequestDto,
  SigninResponseDto,
  SignUpResponseDto,
  TokenResponseDto,
  TokenRequestDto,
  JwtPayload,
} from './dto/auth.dto';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';

@Injectable()
export class AuthService {
  public constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  // 회원가입
  public async signup(dto: SignUpRequestDto): Promise<SignUpResponseDto> {
    const { email, password, name, company, bizno } = dto;

    // 이름, 이메일, 회사 중복 확인
    await this.usersService.checkName({ name });
    await this.usersService.checkEmail({ email });
    await this.usersService.checkCompany({ name: company, bizno });

    const companyIdCheck: { id: string; msg: string } = await this.companyCreate({
      company,
      bizno,
    });

    this.usersService.validatePassword(password);
    const hashedPassword: string = await argon2.hash(password);

    // 사용자 생성 (최고 관리자)
    const superAdmin = await this.prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        companyId: companyIdCheck.id,
        role: 'SUPERADMIN',
      },
    });

    const response: SignUpResponseDto = {
      email: superAdmin.email,
      name: superAdmin.name,
      company: company,
      companyId: companyIdCheck.id,
      role: superAdmin.role,
    };

    return response;
  }

  // 회사 생성 (회원가입 시)
  public async companyCreate(dto: SignUpComponeyRequestDto): Promise<{ id: string; msg: string }> {
    try {
      const { company, bizno } = dto;
      const companyRecord = await this.prisma.company.create({
        data: { name: company, bizno },
        select: { id: true },
      });
      return { msg: '성공', id: companyRecord.id };
    } catch (err: any) {
      const result = { msg: '', id: '' };
      if (err.code === 'P2002') {
        result.msg = '회사가 있습니다.';
      }
      return result;
    }
  }

  // 로그인
  public async login(dto: SignInRequestDto): Promise<SigninResponseDto | null> {
    try {
      const { email, password } = dto;
      const user = await this.prisma.user.findUnique({
        where: { email },
        select: {
          id: true,
          companyId: true,
          company: true,
          email: true,
          name: true,
          role: true,
          password: true,
        },
      });

      console.log('너가 user?', user);
      if (!user) return null;

      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        throw new BadRequestException('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      // JWT 토큰 생성 (payload의 sub 값은 email)
      const tokens = await this.generateToken(user.email);
      console.log('token', tokens);

      return {
        token: {
          accessToken: tokens.accessToken,
          refreshToken: tokens.refreshToken,
        },
        user: {
          email: user.email,
          name: user.name,
          company: {
            name: user.company.name,
            id: user.companyId,
          },
          role: user.role,
          companyId: user.companyId,
        },
      };
    } catch (err) {
      console.error(err);
      return null;
    }
  }

  // JWT 토큰 생성 (로그인 시 호출) – payload의 sub 값은 email
  public async generateToken(email: string): Promise<TokenResponseDto> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(email),
        this.generateRefreshToken(email),
      ]);

      // DB 업데이트: 사용자 email 기준으로 refreshToken 저장
      await this.prisma.user.update({
        where: { email },
        data: { refreshToken },
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('토큰 생성에 실패했습니다.');
    }
  }

  // accessToken 생성 (payload의 sub 값은 email)
  private async generateAccessToken(email: string): Promise<string> {
    const payload: TokenRequestDto = {
      sub: email,
      type: 'access',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    });
  }

  // refreshToken 생성 (payload의 sub 값은 email)
  private async generateRefreshToken(email: string): Promise<string> {
    const payload: TokenRequestDto = {
      sub: email,
      type: 'refresh',
    };

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  // 로그아웃: 쿠키 삭제 및 DB 업데이트
  public async logout(refreshToken: string, @Res() res: Response): Promise<Response> {
    try {
      // refreshToken 검증
      const payload = await this.verifyRefreshToken(refreshToken);
      // payload.sub는 email이므로, 변수명을 email로 사용
      const email = payload.sub;

      // DB 업데이트: 사용자 email 기준으로 refreshToken 무효화
      await this.prisma.user.update({
        where: { email },
        data: { refreshToken: null },
      });

      res.clearCookie('accessToken');
      res.clearCookie('refreshToken');
      return res.json({ message: '로그아웃 성공' });
    } catch (error) {
      if (error instanceof UnauthorizedException) {
        throw error;
      }
      throw new UnauthorizedException('로그아웃을 실패했습니다.');
    }
  }

  // 토큰 검증: accessToken
  public async verifyAccessToken(accessToken: string): Promise<JwtPayload> {
    try {
      return await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch (error: any) {
      throw new UnauthorizedException('액세스 토큰 검증에 실패했습니다.', error.message);
    }
  }

  // 토큰 검증: refreshToken
  public async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      const storedRefreshToken = await this.prisma.user.findFirst({
        where: { refreshToken },
      });

      if (!refreshToken || !storedRefreshToken) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('리프레시 토큰 검증에 실패했습니다.');
    }
  }

  // 토큰 갱신
  public async refreshTokens(refreshToken: string): Promise<{
    header: { accessToken: string; refreshToken: string };
    body: { message: string };
  }> {
    // refreshToken 검증
    const payload = await this.verifyRefreshToken(refreshToken);
    // payload.sub는 email임
    const email = payload.sub;

    const user = await this.prisma.user.findUnique({ where: { email } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('재사용된 토큰입니다.');
    }

    // 기존 refreshToken 무효화
    await this.prisma.user.update({
      where: { email },
      data: { refreshToken: null },
    });

    // 새 토큰 생성 (여기서 payload의 sub 값은 email)
    const tokens = await this.generateToken(email);

    // 널 체크: 생성된 토큰이 null이면 예외 발생
    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new UnauthorizedException('토큰 생성에 실패했습니다.');
    }

    // DB에 새 refreshToken 저장
    await this.prisma.user.update({
      where: { email },
      data: { refreshToken: tokens.refreshToken },
    });

    return {
      header: {
        accessToken: tokens.accessToken,
        refreshToken: tokens.refreshToken,
      },
      body: {
        message: '토큰 갱신 성공',
      },
    };
  }
}
