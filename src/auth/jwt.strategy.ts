import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { ConfigService } from '@nestjs/config';
import { ExtractJwt, Strategy } from 'passport-jwt';

// JWT payload의 타입을 정의
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  companyId: string;
  type: 'access' | 'refresh';
  iat: number;
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
  public validate(payload: JwtPayload): { email: string; expires: number; companyId: string } {
    // payload에서 email과 iat(발행 시간)을 반환
    const result = {
      email: payload.email,
      expires: payload.iat,
      companyId: payload.companyId,
    };

    // ✅ 로그 찍기
    // console.log('🔑 [JwtStrategy] 토큰 payload 정보:', payload);
    // console.log('📦 [JwtStrategy] validate() 리턴값:', result);

    return result;
  }
}
