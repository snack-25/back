import { InvitationStatus, UserRole } from '@prisma/client';
export class Invitation {
  public id: string;
  public name: string;
  public email: string;
  public token: string;
  public role: UserRole;
  public status: InvitationStatus;
  public expiresAt: Date;
  public createdAt: Date;
  public updatedAt: Date;
}
