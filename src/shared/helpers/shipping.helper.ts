import { PrismaService } from '@src/shared/prisma/prisma.service';
import { BadRequestException } from '@nestjs/common';

export async function getShippingFeeByUserId(
  prisma: PrismaService,
  userId: string,
  totalAmount: number,
): Promise<number> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      company: {
        include: {
          companyAddress: true,
        },
      },
    },
  });

  if (!user?.company?.companyAddress) {
    throw new BadRequestException('배송지 정보가 존재하지 않습니다.');
  }

  const feeType = user.company.companyAddress.feeType;

  if (feeType === 'JEJU' || feeType === 'ISOLATED') {
    return 5000;
  }

  const baseFee = totalAmount < 50000 ? 3000 : 0;
  return baseFee;
}
