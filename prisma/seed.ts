// seed.ts
import { PrismaClient } from '@prisma/client';
import { orderRequestItems } from './const/orderRequestItems'; // orderRequestItems.ts 파일에서 데이터 임포트
import { products } from './const/products';

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Seeding database...');

  await prisma.$transaction(async tx => {
    // 1. Company 데이터 추가
    const company = await tx.company.upsert({
      where: { id: 'comp-1' },
      update: {},
      create: {
        id: 'comp-1',
        name: '테스트 회사',
        bizno: '1234567890',
        address: '서울시 강남구 테헤란로 123',
        zipcode: '06100',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 2. User ID 11 추가
    const user11 = await tx.user.upsert({
      where: { id: '11' },
      update: {},
      create: {
        id: '11',
        companyId: company.id,
        email: 'user11@example.com',
        password: 'hashedpassword11',
        name: '테스트 유저 11',
        role: 'USER',
        refreshToken: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 3. 장바구니 추가 (User ID 11)
    await tx.cart.upsert({
      where: { id: 'cart-11' },
      update: {},
      create: {
        id: 'cart-11',
        userId: user11.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 4. 상품 추가 (이미 products 배열에 있음)
    await tx.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    // 5. 주문 요청 추가 (Mock Data)
    await tx.orderRequest.createMany({
      data: [
        {
          id: 'order-1',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 5, // 예시로 주문 요청한 물품 총 수량
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'order-2',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 8,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'order-3',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 2,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    // 6. 주문 요청 아이템 추가 (orderRequestItems.ts에서 import한 데이터 사용)
    await tx.orderRequestItem.createMany({
      data: orderRequestItems,
      skipDuplicates: true,
    });

    console.log('🎉 Seeding complete!');
  });
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
