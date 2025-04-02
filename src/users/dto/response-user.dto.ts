import { UserRole } from '@src/users/enums/role.enum';

export class UserResponseDto {
  public id: string;
  public name: string;
  public email: string;
  public role: (typeof UserRole)[keyof typeof UserRole];
  public companyId: string | null;
  public createdAt: Date;
  public updatedAt: Date;
}
