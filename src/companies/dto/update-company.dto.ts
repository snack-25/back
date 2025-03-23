import { PartialType } from '@nestjs/swagger';
import { CreateCompanyDto } from './create-company.dto';

export class UpdateCompanyDto extends PartialType(CreateCompanyDto) {
  public id: string;
  public address?: string;
  public zipcode?: string;
  public name?: string;
  public bizno?: string;
}
