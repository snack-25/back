import { Injectable, Logger, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '@src/auth/auth.service';
import { JwtPayload } from '@src/auth/dto/auth.dto';

// Request 타입을 확장하여 authService 속성과 user 속성을 추가
export interface RequestWithAuth extends Request {
  authService: AuthService;
  user?: JwtPayload; // 검증된 사용자 정보
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(AuthMiddleware.name);

  public constructor(private readonly authService: AuthService) {}

  public async use(req: RequestWithAuth, res: Response, next: NextFunction): Promise<void> {
    // 요청 객체에 authService를 주입
    req.authService = this.authService;

    this.logger.debug(`요청 경로: ${req.path}`);

    // 인증이 필요하지 않은 경로는 건너뛰기
    if (this.isPublicPath(req.path)) {
      return next();
    }

    try {
      // 쿠키에서 토큰 추출
      const token = this.extractTokenFromCookie(req);

      if (!token) {
        this.logger.debug(`인증 토큰이 없습니다: ${req.method} ${req.path}`);
        throw new UnauthorizedException('인증 토큰이 없습니다.');
      }

      // 토큰 검증
      const payload = await this.authService.verifyAccessToken(token);

      // 검증된 사용자 정보를 요청 객체에 추가
      req.user = payload;

      this.logger.debug(`인증 성공: ${req.method} ${req.path}`);
      next();
    } catch (error) {
      this.logger.error(`인증 실패: ${req.method} ${req.path}`, error);
      throw new UnauthorizedException('유효하지 않은 인증 토큰입니다.');
    }
  }

  // 토큰 추출 헬퍼 메서드 - 쿠키에서 토큰 추출
  private extractTokenFromCookie(request: Request): string | undefined {
    // 쿠키에서 accessToken 추출
    const accessToken = request.cookies?.accessToken as string | undefined;

    // 쿠키에 토큰이 없는 경우 Authorization 헤더에서도 확인 (하위 호환성 유지)
    if (!accessToken) {
      const [type, token] = request.headers.authorization?.split(' ') ?? [];
      return type === 'Bearer' ? token : undefined;
    }

    return accessToken;
  }

  // 인증이 필요하지 않은 공개 경로 확인
  private isPublicPath(path: string): boolean {
    const publicPaths = [
      '/',
      '/auth/login',
      '/auth/signup',
      '/auth/refresh',
      '/auth/invitation',
      '/health',
      '/docs',
      '/api',
      '/favicon.ico',
    ];

    return publicPaths.some(publicPath => path.startsWith(publicPath));
  }
}
