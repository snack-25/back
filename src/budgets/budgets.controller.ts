import { Body, Controller, Post, Req, Res } from '@nestjs/common';
import { Request, Response } from 'express';
import { BudgetsService } from './budgets.service';
import { BudgetsRequestDto } from './dto/budgets.dto';

@Controller('budgets')
export class BudgetsController {
  public constructor(private readonly budgetsService: BudgetsService) {}

  // //TODO: /budgets/{budgetId} (GET) 예산 정보 조회(이번 달 예산, 매달 시작 예산)

  @Post('/inquiry')
  public async inquiry(@Body() dto: BudgetsRequestDto, @Req() req: Request, @Res() res: Response) {
    console.log('실행되는 중');
    const inquiry = await this.budgetsService.getinfo(dto);
    console.log('inquiry', inquiry);

    res.status(200).json({ ok: true, data: inquiry, message: '예산 조회에 성공했습니다' });
  }
  //TODO: /budgets/{budgetId} (PUT/PATCH) 예산 정보 수정
  //TODO: /budgets/{budgetId} (DELETE) 예산 정보 삭제
}
