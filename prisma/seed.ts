import { PrismaClient } from '@prisma/client';
import { orderRequestItems } from './const/orderRequestItems';
import { products } from './const/products';

// .env.local을 로드
const prisma = new PrismaClient();

async function main(): Promise<void> {
  await prisma.$transaction(async tx => {
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

    // 카테고리 추가
    const mainCategories = ['스낵', '음료', '생수', '간편식', '신선식품', '원두커피', '비품'];
    for (const category of mainCategories) {
      await tx.category.upsert({
        where: { id: `cat-${category}` },
        update: {},
        create: {
          id: `cat-${category}`,
          companyId: company.id,
          name: category,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 유저 추가
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

    // 장바구니 추가
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

    // 상품 추가
    await tx.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    // 주문 요청 추가
    await tx.orderRequest.createMany({
      data: [
        {
          id: 'order-1',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 0,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      ],
      skipDuplicates: true,
    });

    // 주문 요청 아이템 추가
    await tx.orderRequestItem.createMany({
      data: orderRequestItems,
      skipDuplicates: true,
    });

    console.log('Seeding complete!');
  });
}

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
