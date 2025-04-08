import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { BudgetsRequestDto, BudgetsResponseDto } from './dto/budgets.dto';

@Injectable()
export class BudgetsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getinfo(dto: BudgetsRequestDto): Promise<BudgetsResponseDto | null> {
    console.log('dto', dto);
    try {
      const info = await this.prisma.budget.findFirst({
        where: {
          companyId: dto.companyId,
        },
        select: {
          companyId: true,
          currentAmount: true,
          initialAmount: true,
          year: true,
          month: true,
        },
      });

      if (!info) {
        return { currentAmount: 0, initialAmount: 0, year: 0, month: 0 }; // 없으면 기본값 0을 반환
      }

      // Prisma에서 반환된 데이터를 BudgetsDto 타입에 맞게 변환
      const transformedInfo: BudgetsRequestDto = {
        companyId: info.companyId,
        currentAmount: info.currentAmount,
        initialAmount: info.initialAmount,
        year: info.year,
        month: info.month,
      };

      return transformedInfo; // 하나의 객체를 반환
    } catch (err) {
      console.error('예산 조회 실패', err);
      return null;
    }
  }

  public async update(dto: BudgetsRequestDto): Promise<BudgetsResponseDto> {
    try {
      // 특정 예산 레코드 조회
      console.log('dto', dto);

      const MAX_AMOUNT = 500_000_000;
      if (dto.currentAmount > MAX_AMOUNT || dto.initialAmount > MAX_AMOUNT) {
        throw new BadRequestException('금액이 5억을 초과하였습니다.');
      }

      const existingBudget = await this.prisma.budget.findUnique({
        where: {
          companyId_year_month: {
            companyId: dto.companyId,
            year: dto.year,
            month: dto.month,
          },
        },
      });

      // 값이 하나라도 0이면 새로 생성
      if (!existingBudget || dto.currentAmount === 0 || dto.initialAmount === 0) {
        const createdBudget = await this.prisma.budget.create({
          data: {
            companyId: dto.companyId,
            currentAmount: dto.currentAmount,
            initialAmount: dto.initialAmount,
            year: dto.year,
            month: dto.month,
            name: `Budget ${dto.year}-${dto.month}`, // 'name' 필수 필드 추가
          },
        });

        return {
          currentAmount: createdBudget.currentAmount,
          initialAmount: createdBudget.initialAmount,
          year: createdBudget.year,
          month: createdBudget.month,
        };
      }

      // 기존 예산 업데이트
      const updatedBudget = await this.prisma.budget.update({
        where: {
          companyId_year_month: {
            companyId: dto.companyId,
            year: dto.year,
            month: dto.month,
          },
        },
        data: {
          currentAmount: dto.currentAmount,
          initialAmount: dto.initialAmount,
        },
      });

      return {
        currentAmount: updatedBudget.currentAmount,
        initialAmount: updatedBudget.initialAmount,
        year: updatedBudget.year,
        month: updatedBudget.month,
      };
    } catch (err) {
      console.error('예산 처리 중 에러 발생', err);
      throw err; // 덮어씌우지 않고 원래 에러 그대로 전달
    }
  }
}
