import { ApiProperty, OmitType, PickType } from '@nestjs/swagger';
import { UserRole } from '@prisma/client';
import { UserDto } from 'src/users/dto/user.dto';

// 회원가입 요청 DTO
export class SignUpRequestDto extends OmitType(UserDto, ['id', 'refreshToken']) {
  public company: string;
  public bizno: string;
}

// 회원가입 응답 DTO
export class SignUpResponseDto extends PickType(UserDto, ['email', 'name']) {
  public company: string;
  public companyId: string;
  public role: string;
  public cartId: string;
}

export class SignUpComponeyRequestDto extends PickType(SignUpRequestDto, ['company', 'bizno']) {}

// 회원가입 응답 DTO
export class SignupResponseDto extends OmitType(UserDto, ['password']) {}

// 로그인 요청 DTO (필요한 Email, Password만 받음)
export class SignInRequestDto extends PickType(UserDto, ['email', 'password']) {
  public cookie: string;
}

// 로그인 응답 DTO
export class SigninResponseDto {
  @ApiProperty({ description: '토큰', type: Object })
  public token: {
    accessToken: string | null;
    refreshToken: string | null;
  };

  @ApiProperty({ description: '사용자 정보', type: Object })
  public user: {
    id: string;
    email: string;
    name: string;
    companyName: string;
    role: string;
    companyId: string;
    cartId: string;
  };
}

// 토큰 생성 요청 DTO
export class TokenRequestDto {
  public sub: string; // 사용자 ID (JWT 표준 필드)
  public email?: string; // 이메일 (선택)
  public role?: UserRole; // 역할 (예: USER, ADMIN)
  public companyId?: string; // ✅ 회사 ID
  public type: 'access' | 'refresh'; // access 또는 refresh 토큰 구분
}

// 토큰 생성 응답 DTO
// 로그인 시에는 accessToken, refreshToken을 반환
// 로그아웃 시에는 둘 다 null로 반환
export class TokenResponseDto {
  public accessToken: string | null;
  public refreshToken: string | null;
}

export class TokenOptionsDto {
  public secret: string;
  public expiresIn: string;
}

//
export class JwtPayload {
  public sub: string; // 사용자 ID
  public name?: string; // 사용자 이름 (필요하면)
  public email?: string; // 사용자 이메일 (필요하면)
  public iat?: number; // 토큰 발행 시간
  public exp?: number; // 토큰 만료 시간 (필요하면)
  public type?: 'access' | 'refresh'; // 토큰 타입
  public role?: UserRole; // 사용자 역할 (필요하면)
  public refreshToken?: string; // 리프레시 토큰 (필요하면)
}

export class InvitationCodeDto {
  public token: string;
}
export class InvitationSignupDto extends PickType(UserDto, ['password']) {
  public token: string;
}

export class decodeAccessToken {
  public sub: string;
  public exp: number;
}

//유저 정보 응답 dto
export class ReulstDto {
  public message?: string;
  public company?: { name: string };
}
