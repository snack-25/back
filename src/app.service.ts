import { Injectable } from '@nestjs/common';

export interface HealthCheckResponse {
  status: string;
  message: string;
  version: string;
  timestamp: string;
}

@Injectable()
export class AppService {
  public getHello(): string {
    return 'Hello World!';
  }

  public getHealth(): HealthCheckResponse {
    return {
      status: 'ok',
      message: '시스템이 정상적으로 가동중입니다!',
      version: process.env.GIT_COMMIT_SHA || 'unknown',
      timestamp: new Intl.DateTimeFormat('ko-KR', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false,
        timeZone: 'Asia/Seoul',
      }).format(new Date()),
    };
  }
}
