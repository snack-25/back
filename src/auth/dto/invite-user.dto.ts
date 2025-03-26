import { IsEmail, IsEnum, IsNotEmpty, IsString } from 'class-validator';
import { UserRole } from '@prisma/client';

// 회원 초대 요청 시 사용할 DTO
export class InviteUserDto {
  @IsNotEmpty()
  @IsString()
  name: string; // 초대받을 유저 이름

  @IsNotEmpty()
  @IsEmail()
  email: string; // 초대받을 유저 이메일

  @IsNotEmpty()
  @IsEnum(UserRole)
  role: UserRole; // 유저 권한 (SUPERADMIN, ADMIN, USER)
}
