import { PrismaClient } from '@prisma/client';
import { ConfigModule } from '@nestjs/config';
import { products } from './const/products';

const prisma = new PrismaClient();

ConfigModule.forRoot({
  envFilePath: `.env.${process.env.NODE_ENV || 'local'}`,
  isGlobal: true,
});

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

    // 4. 상품 추가
    await tx.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    // 5. 주문 요청 추가 (Mock Data)
    const existingProducts = await tx.product.findMany({
      take: 3, // 상위 3개 상품만 사용
      select: { id: true },
    });

    if (existingProducts.length < 3) {
      throw new Error('❌ 충분한 상품 데이터가 없습니다.');
    }

    // 주문 요청 생성
    const orderRequests = await tx.orderRequest.createMany({
      data: [
        {
          id: 'order-1',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 5, // 주문 요청한 물품 총 수량
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'order-2',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 4,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ 주문 요청 데이터 추가 완료!');

    // 6. 주문 요청 아이템 추가
    await tx.orderRequestItem.createMany({
      data: [
        {
          id: 'item-1',
          orderRequestId: 'order-1',
          productId: existingProducts[0].id,
          quantity: 2, // 해당 상품 주문 수량
          price: 1000, // 예제 가격
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'item-2',
          orderRequestId: 'order-1',
          productId: existingProducts[1].id,
          quantity: 3,
          price: 2000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'item-3',
          orderRequestId: 'order-2',
          productId: existingProducts[1].id,
          quantity: 1,
          price: 2000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'item-4',
          orderRequestId: 'order-2',
          productId: existingProducts[2].id,
          quantity: 3,
          price: 3000,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    console.log('✅ 주문 요청 아이템 추가 완료!');
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
