import { Injectable, NestMiddleware } from '@nestjs/common';
import { NextFunction, Request, Response } from 'express';
import { AuthService } from '../../auth/auth.service';

// Request 타입을 확장하여 authService 속성을 추가
export interface RequestWithAuth extends Request {
  authService: AuthService;
}

@Injectable()
export class AuthMiddleware implements NestMiddleware {
  public constructor(private readonly authService: AuthService) {}

  public use(req: Request, res: Response, next: NextFunction): void {
    // 요청 객체에 authService를 주입
    (req as RequestWithAuth).authService = this.authService;
    next();
  }
}
