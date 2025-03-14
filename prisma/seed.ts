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
      totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'order-2',
      requesterId: user11.id,
      companyId: company.id,
      status: 'PENDING',
      totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    {
      id: 'order-3',
      requesterId: user11.id,
      companyId: company.id,
      status: 'PENDING',
      totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
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

// 7. 각 주문 요청에 대해 totalAmount 계산 후 업데이트
const orderRequestIds = ['order-1', 'order-2', 'order-3'];

for (const orderRequestId of orderRequestIds) {
  // 해당 주문 요청의 아이템 조회
  const items = await tx.orderRequestItem.findMany({
    where: { orderRequestId },
  });

  // totalAmount 계산 (각 아이템의 price * quantity 합산)
  const totalAmount = items.reduce(
    (sum, item) => sum + item.price * item.quantity,
    0
  );

  // 주문 요청의 totalAmount 업데이트
  await tx.orderRequest.update({
    where: { id: orderRequestId },
    data: { totalAmount },
  });
}

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
