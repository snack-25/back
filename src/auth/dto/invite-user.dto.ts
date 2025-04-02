import { UserRole } from '@prisma/client';
import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';

// 회원 초대 요청 시 사용할 DTO
export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  public name: string; // 초대받을 유저 이름

  @IsNotEmpty()
  @IsEmail()
  public email: string; // 초대받을 유저 이메일

  @IsNotEmpty()
  @IsEnum(UserRole)
  public role: UserRole; // 유저 권한 (SUPERADMIN, ADMIN, USER)

  // @IsNotEmpty()
  // @IsString()
  // public companyId: string; // 초대를 보낸 회사 ID

  // @IsNotEmpty()
  // @IsString()
  // public inviterId: string; // 초대한 최고관리자 유저 ID
}
