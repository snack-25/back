import { ConflictException, Injectable } from '@nestjs/common';
import { InvitationStatus } from '@prisma/client';
import { SignUpRequestDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';

@Injectable()
export class AuthService {
  constructor(
    private readonly usersService: UsersService,
    private readonly prisma: PrismaService,
    private readonly mailService: MailService,
  ) {}

  // 최고관리자 회원가입 처리
  public async signup(dto: SignUpRequestDto): Promise<void> {
    try {
      await this.usersService.checkEmail({ email: dto.email });
    } catch (error) {
      if (error instanceof ConflictException) {
        throw new ConflictException(`회원가입에 실패했습니다.`);
      }
    }
  }

  // 회원 초대 처리. inviteUser에 로그인 유저 정보 전달 받도록 변경
  public async inviteUser(dto: InviteUserDto, user: { id: string; companyId: string }) {
    const { name, email, role } = dto;

    // 1. 이미 초대한 상태인지 확인
    const exists = await this.prisma.invitation.findFirst({
      where: {
        email,
        companyId: user.companyId,
        status: InvitationStatus.PENDING,
      },
    });
    if (exists) {
      throw new ConflictException('이미 초대된 이메일입니다.');
    }

    // 2. 초대 토큰 생성
    const token = randomUUID();

    // 3. 초대 만료일 설정
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후로 설정

    // 4. 초대 정보 DB 저장
    const invitation = await this.prisma.invitation.create({
      data: {
        name,
        email,
        role,
        token,
        status: InvitationStatus.PENDING,
        inviterId: user.id,
        companyId: user.companyId,
        expiresAt,
      },
    });

    // 5. 초대 메일 발송
    await this.mailService.sendInviteEmail(invitation);
    return { message: '초대 이메일이 전송되었습니다.', token };
  }
}
