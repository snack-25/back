import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty, IsOptional, Matches } from 'class-validator';

const timeString = new Date().getTime().toString();
export class CreateCompanyDto {
  @ApiProperty({
    description: '기업명',
    example: '스낵' + timeString.slice(-2),
  })
  @IsString()
  @IsNotEmpty()
  public name: string;

  @ApiProperty({
    description: '사업자 등록번호',
    example: timeString.slice(0, 10),
  })
  @IsString()
  @IsNotEmpty()
  @Matches(/^\d{10}$/, { message: '사업자 등록번호는 10자리 숫자여야 합니다' })
  public bizno: string;

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
  public zipcode?: string;
}
