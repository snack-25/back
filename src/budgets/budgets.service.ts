import { Injectable } from '@nestjs/common';
import { PrismaService } from '@src/shared/prisma/prisma.service';
import { BudgetsRequestDto, BudgetsResponseDto } from './dto/budgets.dto';
@Injectable()
export class BudgetsService {
  public constructor(private readonly prisma: PrismaService) {}

  public async getinfo(dto: BudgetsRequestDto): Promise<BudgetsResponseDto | null> {
    try {
      const info = await this.prisma.budget.findFirst({
        where: {
          companyId: dto.companyId,
        },
        select: {
          companyId: true,
          year: true,
          month: true,
        },
      });

      if (!info) {
        return { year: 0, month: 0 }; // 없으면 기본값 0을 반환
      }

      // Prisma에서 반환된 데이터를 BudgetsDto 타입에 맞게 변환
      const transformedInfo: BudgetsRequestDto = {
        companyId: info.companyId,
        year: info.year,
        month: info.month,
      };

      return transformedInfo; // 하나의 객체를 반환
    } catch (err) {
      console.error('예산 조회 실패', err);
      return null;
    }
  }

  // public async update(dto: BudgetsRequestDto): Promise<BudgetsResponseDto> {
  //   console.log('updateDto', dto);
  //   try {
  //     // 우선 수정하려는 레코드가 있는지 확인합니다.
  //     const existingBudget = await this.prisma.budgetLedger.findUnique({
  //       where: { id: dto.companyId },
  //     });
  //     console.log('existingBudget', existingBudget);

  //     if (!existingBudget) {
  //       throw new Error('수정하려는 예산이 존재하지 않습니다.');
  //     }

  //     // 레코드가 있으면 수정
  //     const updatedBudget = await this.prisma.budgetLedger.update({
  //       where: { id: dto.companyId },
  //       data: {
  //         beforeAmount: dto.year,
  //         afterAmount: dto.month,
  //       },
  //     });

  //     return {
  //       year: updatedBudget.beforeAmount,
  //       month: updatedBudget.afterAmount,
  //     };
  //   } catch (err) {
  //     console.error('예산 수정 에러남', err);
  //     throw new Error('예산 수정 중 오류 발생');
  //   }
  // }
}
