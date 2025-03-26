import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

// JWT payload의 타입을 정의
interface JwtPayload {
  sub: string; // 사용자 ID (주로 'sub'에 저장)
  email: string; // 사용자 이메일
  iat: number; // 토큰 발행 시간 (Unix timestamp)
}

// `cookies` 속성을 명시적으로 정의
interface CustomRequest extends Request {
  cookies: {
    accessToken: string;
    refreshToken: string;
  };
}

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  // 접근 제어자(public) 명시
  public constructor(private configService: ConfigService) {
    super({
      jwtFromRequest: ExtractJwt.fromExtractors([
        (req: CustomRequest) => req.cookies['accessToken'], // 쿠키에서 accessToken 추출
      ]),
      ignoreExpiration: false, // 만료된 토큰 거부
      secretOrKey: configService.getOrThrow<string>('JWT_SECRET'), // 환경 변수에서 JWT_SECRET 가져오기
    });
  }

  // validate 메서드에서 반환 타입 명시
  public validate(payload: JwtPayload): { email: string; expires: number } {
    // payload에서 email과 iat(발행 시간)을 반환
    return { email: payload.email, expires: payload.iat };
  }
}
