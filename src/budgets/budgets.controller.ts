import { Controller } from '@nestjs/common';
import { BudgetsService } from './budgets.service';

@Controller('budgets')
export class BudgetsController {
  public constructor(private readonly budgetsService: BudgetsService) {}

  //TODO: /budgets/{budgetId} (GET) 예산 정보 조회(이번 달 예산, 매달 시작 예산)
  //TODO: /budgets/{budgetId} (PUT/PATCH) 예산 정보 수정
  //TODO: /budgets/{budgetId} (DELETE) 예산 정보 삭제
}
