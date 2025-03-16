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
      message: 'All Systems Operational!',
      version: process.env.GIT_COMMA_SHA || 'unknown',
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
