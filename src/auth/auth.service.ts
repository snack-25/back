import { ConflictException, Injectable } from '@nestjs/common';
import { SignUpRequestDto } from './dto/auth.dto';
import { UsersService } from '../users/users.service';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { InviteUserDto } from './dto/invite-user.dto';
import { randomUUID } from 'crypto';
import { MailService } from '../mail/mail.service';
import { InvitationStatus } from '@prisma/client';

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

  // 회원 초대 처리
  public async inviteUser(dto: InviteUserDto) {
    const { name, email, role, companyId, inviterId } = dto;

    // 1. 동일 이메일로 이미 초대된 상태인지 확인 (초대 상태가 PENDING인 경우만)
    const exists = await this.prisma.invitation.findFirst({
      where: {
        email,
        companyId,
        status: InvitationStatus.PENDING,
      },
    });
    if (exists) {
      throw new ConflictException('이미 초대된 이메일입니다.');
    }

    // 2. 초대 토큰 생성
    const token = randomUUID();

    // 3. 초대 정보 DB 저장
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 7); // 7일 후로 설정

    const invitation = await this.prisma.invitation.create({
      data: {
        name,
        email,
        role,
        token,
        companyId,
        inviterId,
        status: InvitationStatus.PENDING,
        expiresAt,
      },
    });

    // 4. 초대 이메일 전송
    await this.mailService.sendInviteEmail(invitation);
    return { message: '초대 이메일이 전송되었습니다.', token };
  }
}
