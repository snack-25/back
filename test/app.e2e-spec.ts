import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from './../src/app.module';
import { Server } from 'http';

describe('AppController (e2e)', () => {
  describe('AppController (e2e)', () => {
    let app: INestApplication<Server>;
    beforeEach(async () => {
      const moduleFixture: TestingModule = await Test.createTestingModule({
        imports: [AppModule],
      }).compile();

      app = moduleFixture.createNestApplication();
      await app.init();
    });

    it('/ (GET)', async () => {
      // 비동기 테스트로 변경하고 await 사용
      await request(app.getHttpServer()).get('/').expect(200).expect('Hello World!');
    });
  });
});
