import { OmitType } from '@nestjs/swagger';

// DTO 예시
export class BudgetsRequestDto {
  public companyId: string;
  public year: number;
  public month: number;
  public currentAmount: number; // 또는 클라이언트에서 thisMonth라고 보낸다면 필드명 일치시켜야 함
  public initialAmount: number; // 또는 everyMonth
}

export class BudgetsResponseDto extends OmitType(BudgetsRequestDto, ['companyId']) {}
