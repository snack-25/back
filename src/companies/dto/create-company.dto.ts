import { ApiProperty } from '@nestjs/swagger';
import { IsNotEmpty, IsString, Matches } from 'class-validator';
import { CreateAddressRequestDto } from './addresses.dto';

const timeString = new Date().getTime().toString();
// 기업 생성 시 필요한 정보
export class CreateCompanyDto extends CreateAddressRequestDto {
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
}
