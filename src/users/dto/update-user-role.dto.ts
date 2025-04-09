// 유저 권한 변경 요청 DTO
import { IsEnum } from 'class-validator';

export enum UserRole {
  SUPERADMIN = 'SUPERADMIN',
  ADMIN = 'admin',
  BASIC_USER = 'basicUser',
}

export class UpdateUserRoleDto {
  @IsEnum(UserRole, { message: '올바르지 않은 권한입니다.' })
  role: UserRole;
}
