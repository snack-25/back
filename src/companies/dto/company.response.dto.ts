import { ApiProperty, PickType } from '@nestjs/swagger';
import { FeeType } from '@prisma/client';
import { IsDate, IsEnum, IsOptional, IsString } from 'class-validator';

export class CompanyResponseDto {
  @ApiProperty({
    description: '기업 ID',
    example: 'kmucb8i7durz6je49lpjj6un',
  })
  @IsString()
  public id: string;

  @ApiProperty({
    description: '기업명',
    example: '스낵25',
  })
  @IsString()
  public name: string;

  @ApiProperty({
    description: '사업자 등록번호',
    example: '1234567890',
  })
  @IsString()
  public bizno: string;

  @ApiProperty({
    description: '생성 일시',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDate()
  public createdAt: Date;

  @ApiProperty({
    description: '수정 일시',
    example: '2023-01-01T00:00:00.000Z',
  })
  @IsDate()
  public updatedAt: Date;
}

export class CompanyResponseDtoWithAddress extends PickType(CompanyResponseDto, [
  'id',
  'name',
  'bizno',
  'createdAt',
  'updatedAt',
]) {
  @ApiProperty({
    description: '기업 주소',
    example: '서울특별시 강남구 테헤란로 123',
    required: false,
  })
  @IsString()
  @IsOptional()
  public address?: string;

  @ApiProperty({
    description: '기업 우편번호',
    example: '12345',
    required: true,
  })
  @IsString()
  public zipcode: string;

  @ApiProperty({
    description: '도서산간 여부',
    example: 'ISOLATED',
  })
  @IsEnum(FeeType)
  public feeType: FeeType;
}
