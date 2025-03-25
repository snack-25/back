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
  InvitationCodeDto,
  InvitationSignupDto,
} from './dto/auth.dto';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import * as argon2 from 'argon2';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { Response } from 'express';
import { Invitation } from '@prisma/client';

@Injectable()
export class AuthService {
  public constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
  ) {}

  public async getinfo(dto: InvitationCodeDto): Promise<Invitation | null> {
    const { token } = dto;
    try {
      const invitation = await this.prisma.invitation.findUnique({
        where: {
          token,
        },
      });
      return invitation;
    } catch (err) {
      new BadRequestException('초대 코드가 유효하지 않습니다' + err);
      return null;
    }
  }

  public async invitationSignup(dto: InvitationSignupDto): Promise<string> {
    const { token, password } = dto;
    console.log(dto);
    try {
      const update = await this.prisma.invitation.updateManyAndReturn({
        where: { token },
        data: {
          status: 'ACCEPTED',
        },
        include: {
          company: {
            select: {
              id: true,
            },
          },
        },
      });
      if (!update[0]) return 'update 실패';
      const { email, name, role, company } = update[0];
      // this.usersService.validatePassword(password);
      console.log(password);
      const hashedPassword: string = await argon2.hash(password);
      const userAdd = await this.prisma.user.create({
        data: { email, name, role, password: hashedPassword, companyId: company.id },
      });
      console.log(userAdd);

      if (userAdd) return '회원가입 성공';
      return '회원가입 실패';
    } catch (err) {
      console.error(err);
      return '회원가입 실패';
    }
  }

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
      // 토큰 생성을 위해 가입 날짜(createdAt)도 가져옵니다.
      select: {
        id: true,
        email: true,
        name: true,
        companyId: true,
        company: true,
        role: true,
        createdAt: true,
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
          createdAt: true, // 가입 날짜
        },
      });

      console.log('너가 user?', user);
      if (!user) return null;

      const isPasswordValid = await argon2.verify(user.password, password);
      if (!isPasswordValid) {
        throw new BadRequestException('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      // JWT 토큰 생성 시, payload의 sub 대신 userId와 joinDate 사용
      const tokens = await this.generateToken(user.id, user.createdAt);
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

  // JWT 토큰 생성 (로그인 시 호출) – payload의 sub와 joinDate 사용
  public async generateToken(userId: string, joinDate: Date): Promise<TokenResponseDto> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(userId, joinDate),
        this.generateRefreshToken(userId, joinDate),
      ]);

      // DB 업데이트: 사용자 email 대신 id를 이용해도 되지만,
      // 토큰 생성 시에는 가입 시 제공된 userId와 joinDate로 생성되었으므로,
      // 여기서는 백엔드에서 사용자 조회 시 id로 처리하는 경우에 맞게 수정하거나,
      // 만약 기존 로직대로 이메일로 처리하고 싶다면, 별도로 이메일을 저장해야 합니다.
      // 예시에서는 사용자를 id로 식별합니다.
      await this.prisma.user.update({
        where: { id: userId },
        data: { refreshToken },
      });

      return { accessToken, refreshToken };
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('토큰 생성에 실패했습니다.');
    }
  }

  // accessToken 생성 (payload에 userId와 joinDate 포함)
  private async generateAccessToken(userId: string, joinDate: Date): Promise<string> {
    const payload: TokenRequestDto = {
      sub: userId, // 사용자 ID
      joinDate: joinDate.toISOString(), // 가입 날짜를 문자열로 전달
      type: 'access',
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    });
  }

  // refreshToken 생성 (payload에 userId와 joinDate 포함)
  private async generateRefreshToken(userId: string, joinDate: Date): Promise<string> {
    const payload: TokenRequestDto = {
      sub: userId,
      joinDate: joinDate.toISOString(),
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
      const payload = await this.verifyRefreshToken(refreshToken);
      // payload.sub는 userId
      const userId = payload.sub;

      await this.prisma.user.update({
        where: { id: userId },
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
    const payload = await this.verifyRefreshToken(refreshToken);
    // payload.sub는 userId
    const userId = payload.sub;

    const user = await this.prisma.user.findUnique({ where: { id: userId } });
    if (!user || user.refreshToken !== refreshToken) {
      throw new UnauthorizedException('재사용된 토큰입니다.');
    }

    // 기존 refreshToken 무효화
    await this.prisma.user.update({
      where: { id: userId },
      data: { refreshToken: null },
    });

    const tokens = await this.generateToken(userId, user.createdAt);

    if (!tokens.accessToken || !tokens.refreshToken) {
      throw new UnauthorizedException('토큰 생성에 실패했습니다.');
    }

    await this.prisma.user.update({
      where: { id: userId },
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
