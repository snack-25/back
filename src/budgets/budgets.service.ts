import { Injectable } from '@nestjs/common';
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

      console.log('info', transformedInfo);
      return transformedInfo; // 하나의 객체를 반환
    } catch (err) {
      console.error('예산 조회 실패', err);
      return null;
    }
  }
}
