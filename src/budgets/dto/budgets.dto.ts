import { OmitType } from '@nestjs/swagger';

export class BudgetsRequestDto {
  public companyId: string;
  public year: number;
  public month: number;
}

export class BudgetsResponseDto extends OmitType(BudgetsRequestDto, ['companyId']) {}
