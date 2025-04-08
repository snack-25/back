import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { RequestWithAuth } from '../middleware/auth.middleware';

/**
 * @CurrentUser() 데코레이터
 * 요청에서 인증된 유저 정보를 가져오는 커스텀 데코레이터
 */
export const CurrentUser = createParamDecorator((data: unknown, context: ExecutionContext) => {
  const request = context.switchToHttp().getRequest<RequestWithAuth>();
  return request.user; // AuthMiddleware에서 삽입된 유저 정보
});
