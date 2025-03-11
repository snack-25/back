import { INestApplication, Injectable, OnModuleInit, Logger } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PrismaService extends PrismaClient implements OnModuleInit {
  private readonly logger = new Logger(PrismaService.name);

  // ConfigService를 생성자에 주입 (DI 활용)
  public constructor(private readonly config: ConfigService) {
    super({
      datasources: {
        db: {
          url: config.get<string>('DATABASE_URL'),
        },
      },
      // 로깅 옵션 추가
      log: [
        { emit: 'event', level: 'query' },
        { emit: 'event', level: 'error' },
        { emit: 'stdout', level: 'info' },
        { emit: 'stdout', level: 'warn' },
      ],
    });

    // 쿼리 로깅 설정 (로컬/개발 환경에서만 활성화 추천)
    if (
      config.get<string>('NODE_ENV') === 'local' ||
      config.get<string>('NODE_ENV') === 'development'
    ) {
      this.$on('query', e => {
        this.logger.debug(`Query: ${e.query}`);
        this.logger.debug(`Params: ${e.params}`);
        this.logger.debug(`Duration: ${e.duration}ms`);
      });
    }

    // 에러 로깅 설정
    this.$on('error', (e: Error) => {
      this.logger.error(`Database error: ${e.message}`);
    });
  }

  // 모듈 초기화 시 Prisma 연결
  public async onModuleInit(): Promise<void> {
    try {
      await this.$connect();
      this.logger.log('데이터베이스에 성공적으로 연결되었습니다.');
    } catch (error: unknown) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류 발생';
      this.logger.error(`데이터베이스 연결 실패: ${errorMessage}`);
      // 치명적인 에러인 경우 애플리케이션 종료 고려
      throw error;
    }
  }

  // Graceful Shutdown Hook 설정
  public enableShutdownHooks(app: INestApplication): void {
    const signals = ['SIGINT', 'SIGTERM'];
    signals.forEach(signal => {
      process.on(signal, () => {
        this.logger.log(`${signal} 수신: HTTP 서버와 DB 연결을 종료합니다.`);

        // 애플리케이션 종료 타임아웃 설정 (10초)
        const shutdownTimeout = setTimeout(() => {
          this.logger.error(
            '애플리케이션 종료에 실패하였습니다, 강제로 애플리케이션을 종료합니다.',
          );
          process.exit(1);
        }, 10000);

        void app
          .close()
          .then(() => {
            return this.$disconnect() as Promise<void>;
          })
          .then(() => {
            clearTimeout(shutdownTimeout);
            this.logger.log('애플리케이션이 안전하게 종료되었습니다.');
            process.exit(0);
          })
          .catch((err: Error) => {
            this.logger.error(`애플리케이션 종료 중 에러 발생: ${err}`);
            clearTimeout(shutdownTimeout);
            process.exit(1);
          });
      });
    });
  }
}
