import { InvitationStatus, UserRole } from '@prisma/client';
import { Token } from '../types/token.type';
export interface GenerateToken {
  token: Token;
  expiresAt: Date;
}

export interface InvitationToken {
  token: Token;
  expiresAt: Date;
}

// 초대 타입
export interface Invitation {
  id: string;
  name: string;
  email: string;
  token: Token;
  role: UserRole;
  status: InvitationStatus;
  expiresAt: Date;
  createdAt?: Date;
  updatedAt?: Date;
}
