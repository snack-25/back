import { PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';
import { ApiProperty } from '@nestjs/swagger';
import { IsString, IsNotEmpty } from 'class-validator';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  @ApiProperty({
    description: '기업 ID',
    example: 'pqitr9luxsiblob165ayet8w',
  })
  @IsString()
  @IsNotEmpty()
  public id: string;
}
