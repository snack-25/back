import { PrismaService } from '@src/shared/prisma/prisma.service';
import { BadRequestException, ForbiddenException, NotFoundException } from '@nestjs/common';
import { TransactionType } from '@prisma/client';
import dayjs from 'dayjs';

/**
 * 사용자 ID와 차감 금액을 받아 해당 사용자의 회사 예산을 차감하고
 * 원장에 기록한 뒤, 차감 후 금액을 반환하는 함수
 */
export async function deductCompanyBudgetByUserId(
  prisma: PrismaService,
  userId: string,
  amount: number,
): Promise<number> {
  const now = dayjs();
  const year = now.year();
  const month = now.month() + 1;

  // 사용자 및 회사 조회
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    throw new BadRequestException('회사가 존재하지 않는 사용자입니다.');
  }

  // 해당 월의 예산 조회
  const budget = await prisma.budget.findUnique({
    where: {
      companyId_year_month: {
        companyId: user.companyId,
        year,
        month,
      },
    },
  });

  if (!budget) {
    throw new NotFoundException('해당 월의 예산 정보를 찾을 수 없습니다.');
  }

  if (budget.currentAmount < amount) {
    throw new ForbiddenException('회사 예산이 부족합니다.');
  }

  const beforeAmount = budget.currentAmount;
  const afterAmount = beforeAmount - amount;

  await prisma.$transaction([
    prisma.budget.update({
      where: { id: budget.id },
      data: { currentAmount: afterAmount },
    }),
    prisma.budgetLedger.create({
      data: {
        budgetId: budget.id,
        type: TransactionType.WITHDRAWAL,
        amount: -amount,
        beforeAmount,
        afterAmount,
        description: '주문에 의한 예산 차감',
      },
    }),
  ]);

  return afterAmount;
}

export async function getEstimatedRemainingBudgetByUserId(
  prisma: PrismaService,
  userId: string,
  expectedTotalAmount: number,
): Promise<number> {
  const now = dayjs();
  const year = now.year();
  const month = now.month() + 1;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { companyId: true },
  });

  if (!user?.companyId) {
    throw new NotFoundException('회사가 존재하지 않는 사용자입니다.');
  }

  const budget = await prisma.budget.findUnique({
    where: {
      companyId_year_month: {
        companyId: user.companyId,
        year,
        month,
      },
    },
  });

  if (!budget) {
    throw new NotFoundException('해당 월의 예산 정보를 찾을 수 없습니다.');
  }

  return budget.currentAmount - expectedTotalAmount;
}
