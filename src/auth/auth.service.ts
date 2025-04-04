import {
  BadRequestException,
  ConflictException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  Req,
  Res,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JwtService } from '@nestjs/jwt';
import { Invitation, User } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import * as argon2 from 'argon2';
import { Request, Response } from 'express';
import { UsersService } from '../users/users.service';
import {
  decodeAccessToken,
  InvitationCodeDto,
  InvitationSignupDto,
  JwtPayload,
  ReulstDto,
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

  private readonly logger = new Logger(AuthService.name);

  // 사용자 ID로 사용자 정보 조회
  public async getUserById(
    userId: string,
  ): Promise<Pick<User, 'id' | 'name' | 'email' | 'role' | 'refreshToken'> | null> {
    try {
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { id: true, name: true, email: true, role: true, refreshToken: true },
      });
      return user;
    } catch (error) {
      this.logger.error(`사용자 정보 조회 실패 (ID: ${userId}):`, error);
      return null;
    }
  }

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

      const cartId = await this.cart(userAdd.id);

      // 6. 회원가입 성공, 유저 정보 프론트로 반환
      const response = {
        name: invitation.name,
        company: invitation.company.name,
        companyId: invitation.company.id,
        email: invitation.email,
        role: invitation.role,
        cartId,
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

    const cartId = await this.cart(superAdmin.id);

    const response: SignUpResponseDto = {
      email: superAdmin.email,
      name: superAdmin.name,
      company: company,
      companyId: companyIdCheck.id,
      role: superAdmin.role,
      cartId,
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
    } catch (err) {
      const result = { msg: '', id: '' };
      if (err instanceof PrismaClientKnownRequestError && err.code === 'P2002') {
        result.msg = '회사가 있습니다';
      }
      return result;
    }
  }
  // 장바구니 생성
  public async cart(userId: string): Promise<string> {
    try {
      const cartCreate = await this.prisma.cart.create({
        data: {
          userId,
        },
      });
      const cartId = cartCreate.id;
      return cartId;
    } catch (err) {
      console.error('장바구니 생성 오류:', err);
      throw new BadRequestException('장바구니 생성에 실패했습니다');
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
          company: {
            select: {
              id: true,
              name: true,
            },
          },
          email: true,
          name: true,
          role: true,
          password: true,
          createdAt: true,
          cart: {
            select: {
              id: true,
            },
          },
        },
      });

      if (!user) {
        throw new BadRequestException('이메일 또는 비밀번호가 잘못되었습니다');
      }

      this.logger.log('User found: ', user);

      const isPasswordValid = await argon2.verify(user.password, password);

      this.logger.log('Password verification result: ', isPasswordValid);

      if (!isPasswordValid) {
        throw new BadRequestException('이메일 또는 비밀번호가 잘못되었습니다');
      }

      if (!user.cart) {
        throw new BadRequestException('장바구니를 찾을 수 없습니다');
      }

      // JWT 토큰 생성 시, payload의 sub 대신 userId 사용
      const token = await this.generateToken(user.id);

      const response: SigninResponseDto = {
        token: {
          accessToken: token.accessToken,
          refreshToken: token.refreshToken,
        },
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          companyName: user.company.name,
          companyId: user.companyId,
          cartId: user.cart.id,
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

  // JWT 토큰 생성 (로그인 시 호출) – payload의 sub
  public async generateToken(userId: string): Promise<TokenResponseDto> {
    try {
      // 1. 토큰 생성 시도
      let accessToken: string;
      let refreshToken: string;

      try {
        [accessToken, refreshToken] = await Promise.all([
          this.generateAccessToken(userId),
          this.generateRefreshToken(userId),
        ]);
      } catch (tokenError) {
        this.logger.error('토큰 생성 중 오류 발생', tokenError);
        throw new UnauthorizedException('토큰 생성에 실패했습니다.');
      }

      // 2. DB 업데이트 시도 (트랜잭션 사용)
      try {
        await this.prisma.$transaction(async tx => {
          // 사용자 정보 확인
          const user = await tx.user.findUnique({
            where: { id: userId },
            select: { id: true },
          });

          if (!user) {
            throw new NotFoundException('사용자를 찾을 수 없습니다.');
          }

          // refreshToken 업데이트
          await tx.user.update({
            where: { id: userId },
            data: { refreshToken },
          });
        });
      } catch (dbError) {
        this.logger.error('DB 업데이트 중 오류 발생', dbError);
        // DB 업데이트 실패 시 토큰 생성도 실패로 처리
        throw new InternalServerErrorException('토큰 정보 저장에 실패했습니다.');
      }

      return { accessToken, refreshToken };
    } catch (error) {
      // 상위 레벨 예외 처리
      if (
        error instanceof UnauthorizedException ||
        error instanceof NotFoundException ||
        error instanceof InternalServerErrorException
      ) {
        throw error;
      }

      this.logger.error('토큰 생성 프로세스 중 예상치 못한 오류', error);
      throw new UnauthorizedException('토큰 생성에 실패했습니다.');
    }
  }

  // accessToken 생성 (payload에 userId 포함)
  private async generateAccessToken(userId: string): Promise<string> {
    const payload: TokenRequestDto = {
      sub: userId,
      type: 'access', // 토큰 타입은 액세스 토큰
    };

    // 만료 시간을 명시적으로 설정 (현재 시간 + JWT_EXPIRES_IN)
    const expiresIn = this.configService.getOrThrow<string>('JWT_EXPIRES_IN');

    this.logger.debug(`토큰 생성: 만료 시간 ${expiresIn}`);

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      expiresIn: expiresIn,
    });
  }

  // refreshToken 생성 (payload에 userId 포함)
  private async generateRefreshToken(userId: string): Promise<string> {
    const payload: TokenRequestDto = {
      sub: userId,
      type: 'refresh',
    };

    // 만료 시간을 명시적으로 설정 (현재 시간 + JWT_REFRESH_EXPIRES_IN)
    const expiresIn = this.configService.getOrThrow<string>('JWT_REFRESH_EXPIRES_IN');

    this.logger.debug(`리프레시 토큰 생성: 만료 시간 ${expiresIn}`);

    return this.jwtService.signAsync(payload, {
      secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      expiresIn: expiresIn,
    });
  }

  // accessToken 검증
  public async verifyAccessToken(accessToken: string): Promise<JwtPayload> {
    try {
      this.logger.log('액세스 토큰 검증 시도');

      // 토큰 형식 검증
      if (!accessToken || typeof accessToken !== 'string') {
        this.logger.warn('유효하지 않은 토큰 형식');
        throw new UnauthorizedException('유효하지 않은 토큰 형식입니다.');
      }

      // 토큰 검증
      const payload = await this.jwtService.verifyAsync<JwtPayload>(accessToken, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });

      // 토큰 타입 검증
      if (payload.type !== 'access') {
        this.logger.warn(`잘못된 토큰 타입: ${payload.type}`);
        throw new UnauthorizedException('잘못된 토큰 타입입니다.');
      }

      // 토큰 만료 시간 로깅 (디버깅용)
      if (payload.exp) {
        const expDate = new Date(payload.exp * 1000);
        const now = new Date();
        this.logger.debug(
          `토큰 만료 시간: ${expDate.toISOString()}, 현재 시간: ${now.toISOString()}`,
        );
        this.logger.debug(
          `토큰 만료까지 남은 시간: ${Math.floor((payload.exp * 1000 - now.getTime()) / 1000)}초`,
        );
      }

      this.logger.debug(`토큰 검증 성공: 사용자 ID ${payload.sub}`);
      return payload;
    } catch (error) {
      // 토큰 만료 예외 처리
      if (error.name === 'TokenExpiredError') {
        this.logger.warn('만료된 토큰');
        throw new UnauthorizedException('만료된 토큰입니다.');
      }

      // 기타 JWT 관련 예외 처리
      this.logger.error('액세스 토큰 검증 실패', error);
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
      this.logger.error('리프레시 토큰 검증 실패', error);
      throw new UnauthorizedException('리프레시 토큰 검증에 실패했습니다.');
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
      throw new UnauthorizedException('로그아웃 실패');
    }
  }

  // accessToken 디코딩
  public async decodeAccessToken(accessToken: string): Promise<decodeAccessToken> {
    try {
      const user = await this.verifyAccessToken(accessToken);
      // 디코딩된 토큰은 payload와 iat, exp, sub 등의 정보를 포함
      if (!user.exp) {
        throw new UnauthorizedException('토큰 만료 정보가 없습니다.');
      }
      return {
        sub: user['sub'],
        exp: user['exp'],
      };
    } catch (error) {
      this.logger.error(
        '액세스 토큰 디코딩 실패',
        error instanceof Error ? error.stack : String(error),
      );
      throw new UnauthorizedException('액세스 토큰 디코딩에 실패했습니다.');
    }
  }

  // 쿠키에서 사용자 정보 가져오기
  public async getUserFromCookie(@Req() req: Request): Promise<decodeAccessToken> {
    const accessToken: string | undefined = req.cookies?.accessToken as string | undefined;
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

  // 비밀번호 및 회사명 업데이트
  public async updateData(body: {
    userId: string;
    password?: string;
    company?: string;
  }): Promise<ReulstDto> {
    if (!body.userId) {
      throw new BadRequestException('잘못된 요청입니다');
    }

    const userWithCompany = await this.prisma.user.findUnique({
      where: { id: body.userId },
      include: { company: true },
    });
    if (!userWithCompany) {
      throw new BadRequestException('해당하는 사용자가 존재하지 않습니다.');
    }
    if (!userWithCompany.company) {
      throw new BadRequestException('연결된 회사가 존재하지 않습니다.');
    }

    if (body.password) {
      const hashedPassword = await argon2.hash(body.password);

      const currentData = await this.prisma.user.findUnique({
        where: { id: body.userId },
        select: { password: true, company: true },
      });
      if (!currentData) {
        throw new UnauthorizedException('유저가 없습니다');
      }

      const isSamePassword = await argon2.verify(currentData.password, body.password);

      if (isSamePassword) {
        throw new BadRequestException('전과 동일한 비밀번호는 사용할 수 없습니다');
      }

      await this.prisma.user.update({
        where: { id: body.userId },
        data: { password: hashedPassword },
        select: { id: true },
      });
    }

    if (userWithCompany.company.name === body.company) {
      return { message: '성공', company: { name: userWithCompany.company.name } };
    }
    const { name } = await this.prisma.company.update({
      where: { id: userWithCompany.company.id },
      data: { name: body.company },
      select: { name: true },
    });

    return {
      message: '성공',
      company: { name },
    };
  }
}
