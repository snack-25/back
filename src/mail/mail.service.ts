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

    const html = `
    <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f9f9f9;">
      <div style="max-width: 600px; margin: auto; background: white; padding: 32px; border-radius: 8px; box-shadow: 0 2px 8px rgba(0,0,0,0.05);">
        <h2 style="color: #333;">Snack25 초대 메일</h2>
        <p><strong>${invite.name}</strong> 님, Snack25에 초대되었습니다.</p>
        <p>권한: <strong>${translatedRole}</strong></p>
        <p>아래 버튼을 클릭하여 회원가입을 완료해 주세요.</p>
        <a href="${inviteUrl}" style="display:inline-block; margin-top: 20px; padding: 12px 24px; background-color: #3b82f6; color: white; text-decoration: none; border-radius: 4px;">
          가입하러 가기
        </a>
      </div>
    </div>
  `;

    // 8. Nodemailer를 이용하여 이메일 전송
    await this.transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: invite.email,
      subject: 'Snack25 회원 초대', // 메일 제목
      html,
    });

    return { message: '초대 이메일이 성공적으로 전송되었습니다.' };
  }
}
