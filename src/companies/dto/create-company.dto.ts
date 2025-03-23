import { ApiProperty } from '@nestjs/swagger';

const timeString = new Date().getTime().toString();
export class CreateCompanyDto {
  @ApiProperty({
    description: '기업명',
    example: '스낵' + timeString.slice(-2),
  })
  public name: string;

  @ApiProperty({
    description: '사업자 등록번호',
    example: timeString.slice(0, 10),
  })
  public bizno: string;

  @ApiProperty({
    description: '기업 주소',
    example: '서울특별시 강남구 테헤란로 123',
    required: false,
  })
  public address?: string;

  @ApiProperty({
    description: '기업 우편번호',
    example: '12345',
    required: false,
  })
  public zipcode?: string;
}
