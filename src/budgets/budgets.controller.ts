import { Body, Controller, Post, Res } from '@nestjs/common';
import { Response } from 'express';
import { BudgetsService } from './budgets.service';
import { BudgetsRequestDto } from './dto/budgets.dto';

@Controller('budgets')
export class BudgetsController {
  public constructor(private readonly budgetsService: BudgetsService) {}

  // //TODO: /budgets/{budgetId} (GET) 예산 정보 조회(이번 달 예산, 매달 시작 예산)

  @Post('/inquiry')
  public async inquiry(@Body() dto: BudgetsRequestDto, @Res() res: Response): Promise<void> {
    const inquiry = await this.budgetsService.getinfo(dto);

    res.status(200).json({ ok: true, data: inquiry, message: '예산 조회에 성공했습니다' });
  }
  //TODO: /budgets/{budgetId} (PUT/PATCH) 예산 정보 수정
  // @Put('update')
  // public async update(
  //   @Body() dto: BudgetsRequestDto,
  //   // @Req() req: Request,
  //   // @Res() res: Response,
  // ): Promise<void> {
  //   console.log('dto', dto);

  //   const update = await this.budgetsService.update(dto);

  //   console.log(update);

  //   // res.status(200).json({ ok: true, data: update, message: '예산 변경에 성공했습니다' });
  // }

  //TODO: /budgets/{budgetId} (DELETE) 예산 정보 삭제
}
