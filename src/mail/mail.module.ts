import { Module } from '@nestjs/common';
import { MailService } from './mail.service';

@Module({
  providers: [MailService], // MailService를 NestJS의 DI 컨테이너에 등록
  exports: [MailService], // 다른 모듈에서도 사용 가능하도록 export
})
export class MailModule {}
