import {
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  SetMetadata,
  UnauthorizedException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { User, UserRole } from '@prisma/client';
import { RequestWithAuth } from '@shared/middleware/auth.middleware';

export const ROLES_KEY = 'roles';
export const Role = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles);

@Injectable()
export class RoleGuard implements CanActivate {
  public constructor(private reflector: Reflector) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!requiredRoles || requiredRoles.length === 0) {
      return true;
    }
    const request = context.switchToHttp().getRequest<RequestWithAuth>();

    const { authService } = request;

    if (!authService) {
      throw new ForbiddenException('인증 서비스를 찾을 수 없습니다');
    }

    const accessToken: string = request.cookies?.accessToken;

    try {
      const payload = await authService.verifyAccessToken(accessToken);
      const userInfo: Pick<User, 'id' | 'name' | 'email' | 'role' | 'refreshToken'> | null =
        await authService.getUserById(payload.sub);

      if (!userInfo) {
        throw new NotFoundException('사용자 정보를 찾을 수 없습니다');
      }

      // 필요한 역할 중 하나라도 사용자가 가지고 있는지 확인합니다
      const hasRequiredRole = requiredRoles.some(role => userInfo.role === role);

      if (!hasRequiredRole) {
        throw new UnauthorizedException('이 작업을 수행할 권한이 없습니다');
      }
      return true;
    } catch (error) {
      throw new InternalServerErrorException('권한 검사 중 오류가 발생했습니다: ' + error.message);
    }
  }
}
