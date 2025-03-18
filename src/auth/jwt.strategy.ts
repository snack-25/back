import { Injectable } from '@nestjs/common';
import { PassportStrategy } from '@nestjs/passport';
import { Strategy, ExtractJwt } from 'passport-jwt';
// import { Request } from 'express';

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy, 'jwt-access') {
  public constructor() {
    super({
      // 커스텀 토큰 추출기: 요청 쿠키에서 'jwt' 키를 찾아 반환
      jwtFromRequest: ExtractJwt.fromExtractors([
        // (req: Request) => {
        //   // req.cookies가 없으면 null을 반환
        //   return req?.cookies?.accessToken || null;
        // },
      ]),
      ignoreExpiration: false, // 만료된 토큰은 거부
      secretOrKey: process.env.JWT_SECRET || '아무거나-넣기',
    });
  }

  // 토큰 검증 성공 후 호출되는 메서드.
  // 여기서 반환하는 값이 이후 req.user에 할당됩니다.
  public validate(payload: any) {
    // payload에는 토큰 생성 시 담았던 정보가 있음 (예: userId, email)
    return { userId: payload.id, email: payload.email };
  }
}
