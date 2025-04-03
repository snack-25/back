import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { JsonWebTokenError, JwtService, TokenExpiredError } from '@nestjs/jwt';
import { User } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';

@Injectable()
export class JwtAuthService {
  public constructor(
    private readonly jwtService: JwtService,
    private readonly configService: ConfigService,
    private readonly prisma: PrismaService,
  ) {}

  public async verifyToken(token: string): Promise<User> {
    try {
      return await this.jwtService.verifyAsync(token, {
        secret: this.configService.getOrThrow<string>('JWT_SECRET'),
      });
    } catch (error: unknown) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      } else if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('만료된 토큰입니다.');
      } else {
        throw new UnauthorizedException(`토큰 검증 중 오류 발생: ${error as Error}`);
      }
    }
  }

  public async verifyRefreshToken(refreshToken: string): Promise<User> {
    try {
      const storedRefreshToken = await this.prisma.user.findFirst({
        where: { refreshToken: refreshToken },
      });

      if (!refreshToken || !storedRefreshToken) {
        throw new UnauthorizedException('유효하지 않은 리프레시 토큰입니다.');
      }

      return await this.jwtService.verifyAsync(refreshToken, {
        secret: this.configService.getOrThrow<string>('JWT_REFRESH_SECRET'),
      });
    } catch (error: unknown) {
      if (error instanceof JsonWebTokenError) {
        throw new UnauthorizedException('유효하지 않은 토큰입니다.');
      } else if (error instanceof TokenExpiredError) {
        throw new UnauthorizedException('만료된 토큰입니다.');
      } else {
        throw new UnauthorizedException(`토큰 검증 중 오류 발생: ${error as Error}`);
      }
    }
  }
}
