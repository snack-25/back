import { ApiProperty, PickType } from '@nestjs/swagger';
import { createId } from '@paralleldrive/cuid2';
import { InvitationStatus, UserRole } from '@prisma/client';
import { IsCuid2 } from '@src/shared/decorators/is-cuid2.decorator';
import { IsDateString, IsEmail, IsEnum, IsNotEmpty, IsNumber, IsString } from 'class-validator';
import { addHours } from 'date-fns';
import { Invitation } from '../interfaces/invitation.interface';
import { Token, generateToken } from '../types/token.type';
// 초대 요청 DTO
export class InvitationRequestDto implements Invitation {
  // 초대 ID
  @ApiProperty({
    nullable: false,
    description: '초대 ID(CUID2 형식)',
    example: createId(),
    type: String,
  })
  @IsCuid2() // Custom Decorator을 이용해 CUID2 형식 검증
  public id: string;

  // 이름
  @ApiProperty({
    nullable: false,
    description: '이름',
    example: '홍길동',
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public name: string;

  // 이메일
  @ApiProperty({
    nullable: false,
    description: '이메일',
    example: 'test@test.com',
    type: String,
  })
  @IsEmail()
  @IsNotEmpty()
  @IsString()
  public email: string;

  // 초대 토큰
  @ApiProperty({
    nullable: false,
    description: '초대 토큰',
    example: generateToken(),
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public token: Token;

  // 권한
  @ApiProperty({
    nullable: false,
    description: '초대받은 사람의 권한',
    example: UserRole.USER,
    type: String,
  })
  @IsNotEmpty()
  @IsEnum(UserRole)
  public role: UserRole;

  // 초대 상태
  @ApiProperty({
    nullable: false,
    description: '초대 상태',
    example: InvitationStatus.PENDING,
    type: String,
  })
  @IsEnum(InvitationStatus) // 초대 상태 검증
  public status: InvitationStatus;

  // 만료 날짜
  @ApiProperty({
    nullable: false,
    description: '만료 날짜(토큰 생성일로부터 24시간 이후)',
    example: addHours(new Date(), 24),
    type: Date,
  })
  @IsDateString() // 만료 날짜 검증
  public expiresAt: Date;

  // 회사 ID
  @ApiProperty({
    nullable: false,
    description: '회사 ID',
    example: createId(),
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public companyId: string;

  // 초대자 ID(위 회사ID 기업의 최고관리자 유저 ID)
  @ApiProperty({
    nullable: false,
    description: '초대자 ID',
    example: createId(),
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public inviterId: string;
}

// 초대 토큰 생성 응답 DTO
export class GenerateTokenResponseDto extends PickType(InvitationRequestDto, ['token']) {
  @IsNotEmpty()
  @IsString()
  public token: Token;
}

// 초대 생성 요청 DTO
export class InvitationCreateRequestDto extends PickType(InvitationRequestDto, [
  'name',
  'email',
  'role',
  'companyId',
  'inviterId',
]) {}

// 초대 생성 응답 DTO
export class InvitationCreateResponseDto extends PickType(InvitationRequestDto, ['id']) {
  @ApiProperty({
    nullable: false,
    description: '초대 ID',
    example: createId(),
    type: String,
  })
  @IsNotEmpty()
  @IsString()
  public id: string;

  @IsNotEmpty()
  @IsString()
  public message: string;

  @IsNotEmpty()
  @IsNumber()
  public statusCode: number;
}

// 초대 ID로 조회 요청 DTO
export class InvitationByIdRequestDto extends PickType(InvitationRequestDto, ['id']) {
  @IsNotEmpty()
  @IsString()
  public id: string;
}

// 초대 토큰으로 조회 요청 DTO
export class InvitationByTokenRequestDto extends PickType(InvitationRequestDto, ['token']) {
  @IsNotEmpty()
  @IsString()
  public token: Token;
}
