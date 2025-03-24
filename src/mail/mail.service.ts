import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';
import * as dotenv from 'dotenv';
import { Invitation } from '@prisma/client';

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
   * @param to 수신자 이메일 주소
   * @param token 회원 초대 토큰 (가입 URL에 포함)
   */
  // 초대 이메일 전송 함수
  async sendInviteEmail(invite: Invitation) {
    // 회원가입 페이지 URL에 초대 토큰 추가
    const inviteUrl = `https://ocs.navy/signup?token=${invite.token}`; // 가입 링크

    // Nodemailer를 이용하여 이메일 전송
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM, /// 발신자 이메일 (ex: "Snack25 Team <your-email@example.com>")
      to: invite.email, // 수신자 이메일
      subject: 'Snack25 회원 초대',
      html: `
        <h1>${invite.name} 님, Snack25에 초대되었습니다.</h1>
        <p>권한: <strong>${invite.role}</strong></p>
        <p>아래 링크를 클릭하여 가입을 완료해주세요.</p>
        <a href="${inviteUrl}">${inviteUrl}</a>
      `,
    });

    return { message: '초대 이메일이 성공적으로 전송되었습니다.' };
  }
}
