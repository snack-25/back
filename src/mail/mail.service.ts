import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { Invitation } from '@prisma/client';
import { join } from 'path';
import { readFileSync } from 'fs';
import * as handlebars from 'handlebars';

dotenv.config(); // .env 파일에서 환경 변수를 로드

@Injectable() // NestJS 서비스로 등록하여 의존성 주입 가능하도록 설정
export class MailService {
  private transporter; // Nodemailer의 이메일 전송 객체

  // Nodemailer 전송 객체 생성 (SMTP 설정)
  constructor() {
    this.transporter = nodemailer.createTransport({
      host: process.env.SMTP_HOST, // SMTP 서버 호스트
      port: Number(process.env.SMTP_PORT), // SMTP 포트 (465, 587, 2525 중 선택)
      secure: Number(process.env.SMTP_PORT) === 465, // 포트 465일 때만 true (TLS 사용)
      auth: {
        user: process.env.SMTP_USER, // SMTP 로그인 이메일
        pass: process.env.SMTP_PASS, // SMTP 로그인 비밀번호 또는 앱 비밀번호
      },
    });
  }

  /**
   * 회원 초대 이메일 전송 함수
   * @param invite 초대 정보 (Invitation 객체)
   */
  async sendInviteEmail(invite: Invitation) {
    // 1. 초대 링크 생성 (회원가입 페이지 + 토큰 포함)
    const inviteUrl = `https://ocs.navy/signup?token=${invite.token}`;

    // 2. 권한 정보를 한글로 변환
    const roleMap = {
      SUPERADMIN: '최고관리자',
      ADMIN: '관리자',
      USER: '일반 사용자',
    };
    const translatedRole = roleMap[invite.role];

    // 3. 실행 환경에 따라 템플릿 경로 설정
    const baseDir = __dirname.includes('dist')
      ? join(process.cwd(), 'dist', 'views') // 배포 환경 (빌드된 dist/views)
      : join(process.cwd(), 'src', 'mail', 'views'); // 개발 환경 (src/mail/views)

    console.log(baseDir);

    // 4. 이메일 템플릿 파일 경로 설정
    // baseDir은 mail.service.ts의 실제 경로 → views 디렉토리의 invite.hbs 파일
    const templatePath = join(baseDir, 'invite.hbs');

    // 5. 템플릿 파일을 읽고 문자열로 로드
    const source = readFileSync(templatePath, 'utf8');

    // 6. Handlebars 컴파일 함수 생성
    const template = handlebars.compile(source);

    // 7. 템플릿에 데이터를 바인딩해서 HTML 이메일 본문 생성
    const html = template({
      name: invite.name,
      translatedRole, // 한글 역할
      inviteUrl, // 가입 링크
    });

    // 8. Nodemailer를 이용하여 이메일 전송
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: invite.email,
      subject: 'Snack25 회원 초대', // 메일 제목
      html, // 템플릿으로 만든 본문
    });

    return { message: '초대 이메일이 성공적으로 전송되었습니다.' };
  }
}
