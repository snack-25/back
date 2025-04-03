import {
  BadRequestException,
  ConflictException,
  Injectable,
  Logger,
  Req,
  Res,
  UnauthorizedException,
  InternalServerErrorException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Invitation } from '@prisma/client';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import {
  decodeAccessToken,
  InvitationCodeDto,
  InvitationSignupDto,
  JwtPayload,
  SignInRequestDto,
  SigninResponseDto,
  SignUpComponeyRequestDto,
  SignUpRequestDto,
  SignUpResponseDto,
  TokenRequestDto,
  TokenResponseDto,
} from './dto/auth.dto';

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

  public async invitationSignup(dto: InvitationSignupDto): Promise<SignUpResponseDto | null> {
    try {
      // 1. 초대 토큰을 받아서 회원정보 획득
      const { token, password } = dto;
      const invitation = await this.prisma.invitation.findUnique({
        where: { token },
        select: {
          email: true,
          name: true,
          role: true,
          company: {
            select: {
              id: true,
              name: true,
            },
          },
        },
      });

      // 2. 초대 코드가 유효하지 않으면 예외 처리
      if (!invitation) {
        throw new BadRequestException('초대 코드가 유효하지 않습니다.');
      }

      const existingUser = await this.prisma.user.findUnique({
        where: { email: invitation.email },
      });
      if (existingUser) {
        throw new BadRequestException('이미 가입된 이메일입니다.');
      }

      // 3. 비밀번호 해싱
      const hashedPassword: string = await argon2.hash(password);

      // 4. 유저 생성
      const userAdd = await this.prisma.user.create({
        data: {
          email: invitation.email, // 초대 정보에서 이메일 가져오기
          name: invitation.name, // 초대 정보에서 이름 가져오기
          role: invitation.role, // 초대 정보에서 직급 가져오기
          password: hashedPassword,
          companyId: invitation.company.id, // 초대 정보에서 회사 아이디 가져오기
        },
      });

      if (!userAdd) {
        throw new BadRequestException('회원가입에 실패하였습니다');
      }

      // 5. 초대 상태를 ACCEPTED로 변경
      const updateInvitation = await this.prisma.invitation.update({
        where: { token },
        data: {
          status: 'ACCEPTED', // 상태를 ACCEPTED로 변경
        },
      });

      if (!updateInvitation) {
        throw new BadRequestException('초대 코드 상태 업데이트 실패');
      }

      // 6. 회원가입 성공, 유저 정보 프론트로 반환
      const response = {
        name: invitation.name,
        company: invitation.company.name,
        companyId: invitation.company.id,
        email: invitation.email,
        role: invitation.role,
      };

      return response; // 프론트엔드로 유저 정보 반환
    } catch (err) {
      console.error(err);
      console.error('회원가입 실패');
      return null;
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
      console.log(email, password);

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

      if (!user) {
        throw new BadRequestException('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      Logger.log('User found: ', user);

      const isPasswordValid = await argon2.verify(user.password, password);

      Logger.log('Password verification result: ', isPasswordValid);

      if (!isPasswordValid) {
        throw new BadRequestException('이메일 또는 비밀번호가 잘못되었습니다.');
      }

      // JWT 토큰 생성 시, payload의 sub 대신 userId와 joinDate 사용
      const token = await this.generateToken(user.id);

      const response: SigninResponseDto = {
        token: {
          accessToken: token.accessToken, // 실제 토큰 로직을 넣어줘야 합니다.
          refreshToken: token.refreshToken,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          company: {
            name: user.company ? user.company.name : '',
            id: user.companyId,
          },
          companyId: user.companyId,
        },
      };

      return response;
    } catch (err) {
      console.error('로그인 오류:', err);

      // 🔥 에러를 캐치하더라도 HTTP 응답을 명확하게 반환하도록 수정
      if (err instanceof BadRequestException) {
        throw err; // NestJS에서 자동으로 400 응답 반환
      }

      throw new InternalServerErrorException('서버 오류가 발생했습니다.');
    }
  }

  // JWT 토큰 생성 (로그인 시 호출) – payload의 sub와 joinDate 사용
  public async generateToken(userId: string): Promise<TokenResponseDto> {
    try {
      const [accessToken, refreshToken] = await Promise.all([
        this.generateAccessToken(userId),
        this.generateRefreshToken(userId),
      ]);

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
  private async generateAccessToken(userId: string): Promise<string> {
    const payload: TokenRequestDto = {
      sub: userId, // 사용자 ID
      type: 'access',
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_EXPIRES_IN'),
    });
  }

  // refreshToken 생성 (payload에 userId와 joinDate 포함)
  private async generateRefreshToken(userId: string): Promise<string> {
    const payload: TokenRequestDto = {
      sub: userId,
      type: 'refresh',
    };
    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN'),
    });
  }

  // accessToken 검증
  public async verifyAccessToken(accessToken: string): Promise<JwtPayload> {
    try {
      console.log('쉐리');

      return await this.jwtService.verifyAsync(accessToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('액세스 토큰 검증에 실패했습니다.');
    }
  }

  // refreshToken 검증
  public async verifyRefreshToken(refreshToken: string): Promise<JwtPayload> {
    try {
      // DB에서 저장된 refreshToken을 검증하여 리프레시토큰이 없거나
      // 저장된 리프레시토큰이 비어있으면 예외 발생
      const storedRefreshToken = await this.prisma.user.findFirst({
        where: { refreshToken: refreshToken },
      });

      if (!refreshToken || !storedRefreshToken) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error) {
      throw new UnauthorizedException('리프레시 토큰 검증에 실패했습니다.', error.message);
    }
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
      if (error instanceof ConflictException) {
        throw new ConflictException(`회원가입에 실패했습니다.`);
      }
      // 예외 상황에 대한 HTTP 응답 반환
      return res.status(400).json({ message: '로그아웃 실패', error: error.message });
    }
  }

  // accessToken 디코딩
  public async decodeAccessToken(accessToken: string): Promise<decodeAccessToken> {
    try {
      const user = await this.verifyAccessToken(accessToken);
      // 디코딩된 토큰은 payload와 iat, exp, sub 등의 정보를 포함
      return {
        sub: user['sub'],
        exp: user['exp'],
      };
    } catch (error) {
      throw new UnauthorizedException('액세스 토큰 디코딩에 실패했습니다.', error.message);
    }
  }
  // 쿠키에서 사용자 정보 가져오기
  public async getUserFromCookie(@Req() req: Request): Promise<decodeAccessToken> {
    const accessToken: string | undefined = req.cookies.accessToken;
    if (!accessToken) {
      throw new BadRequestException('로그인이 필요합니다.');
    }
    if (typeof accessToken !== 'string') {
      throw new BadRequestException('유효하지 않은 토큰 형식입니다.');
    }
    const decoded = await this.decodeAccessToken(accessToken);
    if (decoded.exp * 1000 < Date.now()) {
      throw new UnauthorizedException('토큰이 만료되었습니다.');
    }
    return decoded;
  }
}
