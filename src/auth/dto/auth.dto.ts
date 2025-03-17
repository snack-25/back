import { OmitType, PickType } from '@nestjs/swagger';
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
export class SignInRequestDto extends PickType(UserDto, ['email', 'password']) {}

// 로그인 응답 DTO
export class SigninResponseDto extends SignupResponseDto {}

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
