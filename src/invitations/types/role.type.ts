import { UserRole } from '@src/users/enums/role.enum';

// UserRoleType은 열거형의 값을 타입으로 정의한 객체
type UserRoleType = {
  [K in keyof typeof UserRole]: Extract<keyof typeof UserRole, K>;
};
// SUPERADMIN를 제외한 유져 권한 항목을 유지하는 타입 정의
export type InvitationableRoleType = Omit<UserRoleType, 'SUPERADMIN'>;
