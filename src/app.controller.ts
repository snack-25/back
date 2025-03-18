import { Controller, Get, Headers, HttpCode, UnauthorizedException } from '@nestjs/common';
import { AppService, HealthCheckResponse } from './app.service';

@Controller()
export class AppController {
  public constructor(private readonly appService: AppService) {}

  @Get()
  public getHello(): string {
    return this.appService.getHello();
  }

  @Get('health')
  @HttpCode(200)
  public getHealth(@Headers('X-Deploy-Key') deployKey: string): HealthCheckResponse {
    if (deployKey !== process.env.DEPLOY_VERIFY_KEY) {
      throw new UnauthorizedException('배포 키가 올바르지 않습니다.');
    }
    return this.appService.getHealth();
  }
}
