import { NestFactory } from '@nestjs/core';
import cookieParser from 'cookie-parser';
import { SwaggerModule, SwaggerCustomOptions, OpenAPIObject } from '@nestjs/swagger';
import docsOptions from '@shared/swagger/SwaggerOptions';
import { AppModule } from './app.module';

async function bootstrap(): Promise<void> {
  const app = await NestFactory.create(AppModule);

  // Swagger Custom Options 및 Swagger Options 설정
  const customOption: SwaggerCustomOptions = docsOptions.swaggerCustom();
  const swaggerOptions: Omit<OpenAPIObject, 'paths'> = docsOptions.swagger();

  // Swagger 문서 생성
  const document = SwaggerModule.createDocument(app, swaggerOptions);
  // Swagger UI 설정
  SwaggerModule.setup('api', app, document, customOption);
  // CORS 설정
  app.enableCors({
    origin: ['http://localhost:3000', 'https://ocs.navy', 'https://www.ocs.navy'],
    methods: 'GET,HEAD,PUT,PATCH,POST,DELETE',
    credentials: true,
    preflightContinue: false,
    optionsSuccessStatus: 204,
  });
  // Cookie Parser 사용
  app.use(cookieParser());
  // 4000번 포트에서 서버 실행
  await app.listen(process.env.PORT ?? 4000, process.env.HOST ?? '0.0.0.0');
}

bootstrap().catch((err: unknown) => {
  const errorMessage = err instanceof Error ? err.message : String(err);
  console.error('NestJS App을 실행할 수 없습니다!:', errorMessage);
});
