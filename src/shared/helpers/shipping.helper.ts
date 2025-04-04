import { PrismaService } from '@src/shared/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

const JEJU_ISOLATED_SHIPPING_FEE = 5000;
const STANDARD_SHIPPING_FEE = 3000;
const FREE_SHIPPING_THRESHOLD = 50000;

export async function getShippingFeeByUserId(
  prisma: PrismaService,
  userId: string,
  totalAmount: number,
): Promise<number> {
  if (totalAmount === 0) return 0;

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: {
      company: {
        select: {
          companyAddress: {
            select: {
              feeType: true,
            },
          },
        },
      },
    },
  });

  if (!user) {
    throw new BadRequestException('사용자 정보를 찾을 수 없습니다.');
  }

  const feeType = user.company?.companyAddress?.feeType;

  if (!feeType) {
    throw new BadRequestException('배송지 정보가 존재하지 않습니다.');
  }

  if (feeType === 'JEJU' || feeType === 'ISOLATED') {
    return JEJU_ISOLATED_SHIPPING_FEE;
  }

  const baseFee = totalAmount < FREE_SHIPPING_THRESHOLD ? STANDARD_SHIPPING_FEE : 0;
  return baseFee;
}
