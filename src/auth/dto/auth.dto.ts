import { OmitType, PickType, ApiProperty } from '@nestjs/swagger';
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
    email: string;
    name: string;
    company: { name: string; id: string };
    role: string;
    companyId: string;
  };
}

// 토큰 생성 요청 DTO
export class TokenRequestDto {
  public sub: string;
  public type: 'access' | 'refresh';
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
export interface JwtPayload {
  sub: string; // 사용자 ID
  email: string; // 사용자 이메일 (필요하다면)
  iat: number; // 토큰 발행 시간
  exp: number; // 토큰 만료 시간 (필요하면)
}
