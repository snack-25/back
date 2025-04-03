import {
  createParamDecorator,
  ExecutionContext,
  Inject,
  InternalServerErrorException,
  UnauthorizedException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { isCuid } from '@paralleldrive/cuid2';
import { User } from '@prisma/client';
import { ValidatorConstraintInterface } from 'class-validator';
import { RequestWithAuth } from '../middleware/auth.middleware';

/**
 * 사용자 정보 데커레이터
 * 목적 : 각종 컨트롤러에서 데커레이터 추가만으로 사용자 정보(userId, role 등)를 쉽게 가져올 수 있도록 하기 위함
 * @export
 * @class GetUserConstraint
 * @implements {ValidatorConstraintInterface}
 */
export class GetUserConstraint implements ValidatorConstraintInterface {
  /**
   *
   *
   * @param {string} value
   * @return {*}  {boolean}
   * @memberof GetUserConstraint
   */

  public constructor(
    @Inject(JwtService) private readonly jwtService: JwtService,
    @Inject(ConfigService) private readonly configService: ConfigService,
  ) {}

  public validate(value: string): boolean {
    return typeof value === 'string' && isCuid(value);
  }

  public defaultMessage(): string {
    return `CUID2 형식이 유효하지 않습니다.`;
  }
}

/**
 * 사용자 정보 데커레이터
 * 목적 : 각종 컨트롤러에서 데커레이터 추가만으로 사용자 정보(userId, role 등)를 쉽게 가져올 수 있도록 하기 위함
 * 요청 : 쿠키에 저장된 JWT 토큰(accessToken)
 * 응답 : 사용자 정보(userId, role 등)
 * 예시 : @GetUser() user: User
 * @export {@GetUser() user: User}
 * @param {unknown} _data
 * @param {ExecutionContext} ctx
 * @return {Promise<Pick<User, 'id' | 'email' | 'role' | 'refreshToken'>>}
 */
export const GetUser = createParamDecorator(
  async (
    data: unknown,
    ctx: ExecutionContext,
  ): Promise<Pick<User, 'id' | 'role' | 'refreshToken'>> => {
    try {
      // 요청 객체를 불러옴
      const request = ctx.switchToHttp().getRequest<RequestWithAuth>();

      // 쿠키에서 액세스 토큰을 가져옴()
      const accessToken: string | undefined = request.cookies?.accessToken;

      // 액세스 토큰이 없으면 예외 발생
      if (!accessToken) {
        throw new UnauthorizedException(`JWT 토큰(accessToken)이 없습니다.`);
      }

      // AuthService를 가져옴
      const { authService } = request;

      if (!authService) {
        throw new InternalServerErrorException('AuthService를 찾을 수 없습니다.');
      }

      // 액세스 토큰을 검증하고 페이로드를 가져옴
      const payload = await authService.verifyAccessToken(accessToken);

      if (!payload || !payload.sub) {
        throw new UnauthorizedException('유효하지 않은 토큰 페이로드입니다.');
      }

      // 페이로드에서 필요한 사용자 정보 추출
      // sub는 사용자 ID로 사용됨
      const userInfo: Pick<User, 'id' | 'email' | 'role' | 'refreshToken'> = {
        id: payload.sub,
        email: payload.email,
        role: 'USER',
        refreshToken: null,
      };

      // 사용자 정보 반환
      return userInfo;
    } catch (error) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException(
          `JWT 토큰(accessToken)이 유효하지 않습니다. ${error.message}`,
        );
      } else if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException(`JWT 토큰(accessToken)이 만료되었습니다. ${error.message}`);
      } else if (error instanceof InternalServerErrorException) {
        throw new InternalServerErrorException(
          `JWT 토큰(accessToken) 검증 중 오류가 발생했습니다. ${error.message}`,
        );
      } else {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        throw new UnauthorizedException(
          `회원 정보를 불러오는 중 오류가 발생했습니다. ${errorMessage}`,
        );
      }
    }
  },
);
