import { ApiProperty, PickType } from '@nestjs/swagger';
import { FeeType } from '@prisma/client';
import { IsCuid2 } from '@src/shared/decorators/is-cuid2.decorator';
import { IsEnum, IsOptional, IsString, Matches } from 'class-validator';

export class AddressRequestDto {
  @ApiProperty({
    description: '주소 ID',
    example: 'jd35u673zxefod5ndyw0basy',
  })
  @IsCuid2()
  public id: string;

  @ApiProperty({
    description: '회사 ID',
    example: 'qsch6ljzbigconazqak4jsrr',
  })
  @IsCuid2()
  public companyId: string;

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
    required: false,
  })
  @IsString()
  @IsOptional()
  @Matches(/^\d{5}$/, { message: '우편번호는 5자리 숫자여야 합니다' })
  public postalCode?: string;

  @ApiProperty({
    description: '도서산간 여부',
    example: FeeType.ISOLATED,
  })
  @IsEnum(FeeType)
  public feeType: FeeType;
}

export class CreateAddressRequestDto extends PickType(AddressRequestDto, [
  'address',
  'postalCode',
  'feeType',
]) {}

export class AddressResponseDto extends PickType(AddressRequestDto, [
  'address',
  'postalCode',
  'feeType',
]) {}
