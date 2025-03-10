import { Controller } from '@nestjs/common';
import { CompaniesService } from './companies.service';

@Controller('companies')
export class CompaniesController {
  public constructor(private readonly companiesService: CompaniesService) {}

  //TODO: /companies/{companyId} (GET) 기업 정보 조회
  //TODO: /companies/{companyId} (PUT/PATCH) 기업 정보 수정
}
