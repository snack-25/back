/* eslint-disable no-console */
import {
  BadRequestException,
  HttpStatus,
  Injectable,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { UserRole } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { DateUtil } from '@src/shared/utils/date.util';
import * as crypto from 'crypto';
import { addHours } from 'date-fns';
import nodemailer from 'nodemailer';
import {
  GenerateTokenResponseDto,
  InvitationCreateRequestDto,
  InvitationCreateResponseDto,
} from './dto/invitation.dto';
import { HashAlgorithm } from './enums/hash-algorithm.enum';
import { Invitation } from './interfaces/invitation.interface';
import { Token } from './types/token.type';
@Injectable()
export class InvitationsService {
  public constructor(private readonly prisma: PrismaService) {} // PrismaService를 주입받아 데이터베이스 연결
  // 파일 읽기/쓰기(I/O), 네트워크 요청, 데이터베이스 조회/저장 시 비동기 코드를 사용해야 함
  // crypto.randomBytes를 비동기로 사용할 때 아래 메서드를 사용하면 됨
  // private randomBytesAsync = promisify(crypto.randomBytes);

  // 초대에 필요한 내용 정리
  // 유저 정보: name, email, role(UserRole.ADMIN, UserRole.USER)
  // 초대 상태: 기본 상태는 PENDING(가능한 나머지 상태는 ACCEPTED, REJECTED, EXPIRED)
  // 1. 최고관리자가 초대하기 위해서는 초대 대상 정보(이메일, 이름, 사용자권한)가 필요함
  // 1-1. 이 떄 초대 대상(이메일, 이름, 권한)은 초대 토큰을 생성하기 전에 존재해야 함(최고관리자가 입력한 값)
  // 2. 초대 토큰 생성(nodejs 내장 crypto 모듈을 사용하여 32바이트 랜덤 문자열 생성)
  // 2-1. 초대 토큰 해시(미사용, 해시 대신 직접 데이터베이스에서 초대 ID를 통해 조회하는 것이 안전함)
  // 3. 초대 생성하기
  // 4. 초대 조회하기
  // 4-1. 초대 ID로 조회하기
  // 4-2. 초대 토큰으로 조회하기
  // 5. 초대 토큰 검증
  // 5-1. 초대 토큰 만료 시간 검증
  // 6. 초대 메일 템플릿
  // 7. 초대 메일 발송

  // public generateId(@Param('q') quantity?: number): string[] {
  //   return Array.from({ length: quantity ?? 1 }, () => createId());
  // }

  //TODO: 초대 토큰 생성
  public generateToken(): GenerateTokenResponseDto {
    try {
      // 32바이트(64자) 랜덤 HEX 문자열 생성
      const token = crypto.randomBytes(32).toString('hex');
      console.log(`초대 토큰: ${token}`);
      return { token: token };
    } catch (error) {
      console.error(`토큰 생성 에러: ${error}`);
      throw new InternalServerErrorException(`토큰 생성에 실패했습니다.`);
    }
  }

  //TODO: 초대 토큰 해시(미사용, 해시 대신 직접 데이터베이스에서 초대 ID를 통해 조회하는 것이 안전함)
  // 초대 토큰 해시 payload에 초대 토큰 검증 시 수신자와 토큰 만료 시간을 식별하기 위해 이메일과 타임스탬프를 포함
  public hashToken(email: string, token: string): Token {
    try {
      const expiresAt: Date = addHours(new Date(), 24); // 초대 토큰 만료시간은 토큰 생성 24시간 후
      const timestamp: number = expiresAt.getTime(); // 타임스탬프는 초대 토큰 만료시간을 밀리초로 변환
      const tokenPayload: string = `${timestamp}:${email}:${token}`; // 초대 토큰 페이로드 생성
      const hashedToken: string = crypto
        .createHash(HashAlgorithm.SHA256)
        .update(tokenPayload)
        .digest('hex'); // 초대 토큰 페이로드를 해시하여 초대 토큰 해시 값 생성
      console.log(`\x1b[32m토큰 페이로드: ${tokenPayload}\x1b[0m`);
      console.log(`\x1b[32m토큰 만료일시: ${DateUtil.formatDate(expiresAt)}\x1b[0m`);
      console.log(`\x1b[32m해시된 토큰: ${hashedToken}\x1b[0m`);
      // this.isTokenExpired(hashedToken);
      return hashedToken;
    } catch (error) {
      console.error(`토큰 해시 에러: ${error}`);
      throw new InternalServerErrorException(`토큰 해시에 실패했습니다.`);
    }
  }

  //TODO: 초대 생성하기(Network I/O 및 데이터베이스 조회 기능 있으므로 비동기 처리)
  /**
   * 초대 요청으로 email, name, role을 받아서 token을 반환
   * @param {InvitationRequestDto} dto
   * @return {*}  {Promise<Invitation>}
   * @memberof InvitationsService
   */
  public async createInvitation(
    dto: InvitationCreateRequestDto,
  ): Promise<InvitationCreateResponseDto> {
    try {
      // dto 검증
      if (!dto || !dto.email || !dto.name || !dto.role || !dto.companyId || !dto.inviterId) {
        throw new BadRequestException('초대 정보가 올바르지 않습니다.');
      }
      // 요청 권한 검증
      if (dto.role === UserRole.SUPERADMIN) {
        throw new UnauthorizedException('최고관리자는 초대할 수 없습니다.');
      }

      // 초대 토큰 생성
      const { token } = this.generateToken();
      // 초대 토큰 만료 시간 설정(토큰 생성 24시간 후)
      const expiresAt = addHours(new Date(), 24);

      // 초대 생성 후 이메일 발송 처리되도록 트랜잭션 처리
      const invitation = await this.prisma.$transaction(async tx => {
        // 테이블에 초대 정보 생성(id, email, name, token, role, expiresAt, companyId, inviterId)
        // 트랜잭션 없이 단순 초대 저장
        const createdInvitation = await this.prisma.invitation.create({
          data: {
            email: dto.email,
            name: dto.name,
            token,
            role: dto.role,
            expiresAt,
            companyId: dto.companyId,
            inviterId: dto.inviterId,
          },
        });

        // 트랜잭션 외부에서 메일 발송 (추천)
        await this.sendInvitationEmail(createdInvitation.id);
        return createdInvitation;
      });
      return {
        id: invitation.id,
        message: '초대 메일 발송 완료',
        statusCode: HttpStatus.OK,
      };
    } catch (error) {
      console.error(`초대 생성 에러: ${error}`);
      throw new InternalServerErrorException(`초대 생성에 실패했습니다.`);
    }
  }

  //TODO: 초대 ID로 조회하기
  public async getInvitationById(id: string): Promise<Invitation> {
    try {
      const invitation = await this.prisma.invitation.findUnique({
        where: { id: id },
      });
      if (!invitation) {
        throw new NotFoundException('초대 토큰이 없습니다.');
      }
      return invitation;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(`데이터베이스 조회 결과 초대 정보가 없습니다.`);
      }
      console.error(`초대 조회 에러: ${error}`);
      throw new InternalServerErrorException(`초대 조회에 실패했습니다.`);
    }
  }

  //TODO: 초대 토큰으로 조회하기
  public async getInvitationByToken(token: Token): Promise<Invitation> {
    try {
      const invitation = await this.prisma.invitation.findUnique({
        where: { token: token },
      });
      if (!invitation) {
        throw new NotFoundException('초대 토큰이 없습니다.');
      }
      return invitation;
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(`데이터베이스 조회 결과 초대 정보가 없습니다.`);
      }
      console.error(`초대 조회 에러: ${error}`);
      throw new InternalServerErrorException(`초대 조회에 실패했습니다.`);
    }
  }

  //TODO: 초대 조회하기
  public async getInvitation(token: Token): Promise<Invitation | Error> {
    try {
      const invitation = await this.verifyToken(token);
      // 초대 정보가 없으면 에러 발생
      if (invitation instanceof Error) {
        throw new InternalServerErrorException(`초대 조회에 실패했습니다.`);
      }
      console.log(`\x1b[32m초대 조회: ${JSON.stringify(invitation)}\x1b[0m`);
      return invitation;
    } catch (error) {
      console.error(`초대 조회 에러: ${error}`);
      throw new InternalServerErrorException(`초대 조회에 실패했습니다.`);
    }
  }

  //TODO: 초대 토큰 만료 시간 검증
  public isTokenExpired(invitation: Invitation): boolean {
    const now = new Date();
    const isExpired = now > invitation.expiresAt;
    console.log(`토큰 만료여부: ${isExpired ? '만료' : '유효'}`);
    return isExpired;
  }

  //TODO: 초대 토큰 검증(만료 시간 확인 포함)
  public async verifyToken(token: Token): Promise<Invitation | Error> {
    try {
      const invitation = await this.getInvitationByToken(token);
      if (!invitation) {
        throw new BadRequestException('초대 토큰이 없습니다.');
      }
      const isExpired = this.isTokenExpired(invitation);
      if (isExpired) {
        throw new UnauthorizedException('초대 토큰이 만료되었습니다.');
      }
      return invitation;
    } catch (error) {
      console.error(`토큰 검증 에러: ${error}`);
      throw new InternalServerErrorException('토큰 검증에 실패했습니다.');
    }
  }

  //TODO: 초대 메일 발송을 위한 설정
  public mailerConfig(): nodemailer.Transporter {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.NODE_MAILER_ID,
        pass: process.env.NODE_MAILER_PW,
      },
    });
  }

  //TODO: 초대 메일 템플릿
  public mailTemplate(name: string, token: Token): string {
    const url = process.env.FRONTEND_HOST;
    return `
    <h1>초대 메일</h1>
    <p>안녕하세요. ${name}님 초대합니다.</p>
    <a href="${url}/auth/signup?token=${token}">초대 페이지</a>
    `;
  }

  //TODO: 초대 메일 발송
  // 발송에 필요한 email, name, token은 Invitation id로 조회
  public async sendInvitationEmail(id: string): Promise<void> {
    try {
      const invitation = await this.getInvitationById(id);
      if (!invitation) {
        throw new BadRequestException('초대 정보가 없습니다.');
      }
      const transporter = this.mailerConfig();
      const mailOptions = {
        from: process.env.NODE_MAILER_ID,
        to: invitation.email,
        subject: '회사에서 Snack25로 당신을 초대했어요!',
        html: this.mailTemplate(invitation.name, invitation.token),
      };
      await transporter.sendMail(mailOptions);
    } catch (error) {
      if (error instanceof PrismaClientKnownRequestError) {
        throw new InternalServerErrorException(`데이터베이스 조회 결과 초대 정보가 없습니다.`);
      }
      console.error(`초대 메일 발송 에러: ${error}`);
      throw new InternalServerErrorException(`초대 메일 발송에 실패했습니다.`);
    }
  }
}
