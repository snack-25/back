import { Module } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { UsersService } from '@src/users/users.service';
import { PrismaModule } from '@src/shared/prisma/prisma.module';
import { MailModule } from '@src/mail/mail.module';

@Module({
  controllers: [AuthController], // 인증 관련 라우트 담당
  providers: [AuthService, UsersService], // 인증 서비스 + 유저 서비스 주입
  imports: [PrismaModule, MailModule], // DB 연결 + 이메일 전송 모듈 주입
})
export class AuthModule {}
