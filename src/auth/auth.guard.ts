import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from '@nestjs/common';
import { Request } from 'express';
import { AuthService } from './auth.service';

@Injectable()
export class AuthGuard implements CanActivate {
  public constructor(private readonly authService: AuthService) {}

  public async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>(); // ✅ 불필요한 타입 단언 제거

    // 로그인, 회원가입 페이지는 가드 검사 생략
    if (
      request.path.startsWith('/api/auth/signup') ||
      request.path.startsWith('/api/auth/login') ||
      request.path.startsWith('/api/auth/logout') ||
      request.path.startsWith('/health')
    ) {
      return true;
    }

    return await this.validateRequest(request);
  }

  private async validateRequest(request: Request): Promise<boolean> {
    const cookies = request.cookies as Record<string, string>; // ✅ 명확한 타입 지정
    const accessToken: string | undefined = cookies?.accessToken;
    const refreshToken: string | undefined = cookies?.refreshToken;

    if (!accessToken || !refreshToken) {
      throw new UnauthorizedException('로그인이 필요합니다.(토큰 없음)');
    }
    try {
      await this.authService.verifyAccessToken(accessToken);
      await this.authService.verifyRefreshToken(refreshToken);
    } catch (error) {
      console.error(error);
      throw new UnauthorizedException('로그인이 필요합니다.(권한 없음)');
    }
    return true;
  }
}
