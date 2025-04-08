import { Body, Controller, Put, Post, Res, NotFoundException } from '@nestjs/common';
import { Response } from 'express';
import { BudgetsService } from './budgets.service';
import { BudgetsRequestDto } from './dto/budgets.dto';
import { ApiBearerAuth, ApiOperation, ApiResponse } from '@nestjs/swagger';

@ApiBearerAuth()
@Controller('budgets')
export class BudgetsController {
  public constructor(private readonly budgetsService: BudgetsService) {}

  // //TODO: /budgets/{budgetId} (GET) 예산 정보 조회(이번 달 예산, 매달 시작 예산)

  @ApiOperation({
    summary: '예산 조회',
    description: '예산 조회',
  })
  @ApiResponse({ status: 200, description: '예산 조회에 성공했습니다' })
  @Post('/inquiry')
  public async inquiry(@Body() dto: BudgetsRequestDto, @Res() res: Response): Promise<void> {
    const inquiry = await this.budgetsService.getinfo(dto);
    res.status(200).json({ data: inquiry, message: '예산 조회에 성공했습니다' });
  }

  //TODO: /budgets/{budgetId} (PUT/PATCH) 예산 정보 수정
  @ApiOperation({
    summary: '예산 정보 수정',
    description: '예산 정보 수정',
  })
  @ApiResponse({ status: 200, description: '예산 정보 수정에 성공했습니다' })
  @Put('update')
  public async update(@Body() dto: BudgetsRequestDto, @Res() res: Response): Promise<void> {
    const update = await this.budgetsService.update(dto);
    if (!update) {
      throw new NotFoundException('예산 정보를 찾을 수 없습니다.');
    }
    res.status(200).json({ data: update, message: '예산 변경에 성공했습니다' });
  }
  //TODO: /budgets/{budgetId} (DELETE) 예산 정보 삭제
}
