import { PrismaClient } from '@prisma/client';
import { orderRequestItems } from './const/orderRequestItems'; // orderRequestItems.ts 파일에서 데이터 임포트
import { products } from './const/products';

const prisma = new PrismaClient();

async function main(): Promise<void> {
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

    // 2. 메인 카테고리 추가
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

    // 3. 서브카테고리 추가
    const subCategories = {
      스낵: [
        '과자',
        '쿠키',
        '파이',
        '초콜릿류',
        '캔디류',
        '껌류',
        '비스켓류',
        '씨리얼바',
        '젤리류',
        '견과류',
        '워터젤리',
      ],
      음료: [
        '청량/탄산음료',
        '과즙음료',
        '에너지음료',
        '이온음료',
        '유산균음료',
        '건강음료',
        '차류',
        '두유/우유',
        '커피',
      ],
      생수: ['생수', '스파클링'],
      간편식: [
        '봉지라면',
        '과일',
        '컵라면',
        '핫도그 및 소시지',
        '계란',
        '죽/스프류',
        '컵밥류',
        '시리얼',
        '반찬류',
        '면류',
        '요거트류',
        '가공안주류',
        '유제품',
      ],
      신선식품: ['샐러드', '빵', '햄버거/샌드위치', '주먹밥/김밥', '도시락'],
      원두커피: ['드립커피', '원두', '캡슐커피'],
      비품: ['커피/차류', '생활용품', '일회용품', '사무용품', '카페용품', '일회용품(친환경)'],
    };

    for (const [mainCategory, subCategoryList] of Object.entries(subCategories)) {
      const parentCategory = await tx.category.findUnique({
        where: { id: `cat-${mainCategory}` },
      });

      if (!parentCategory) {
        console.error(`❌ 메인 카테고리를 찾을 수 없습니다: ${mainCategory}`);
        continue;
      }

      for (const subCategory of subCategoryList) {
        await tx.category.upsert({
          where: { id: `sub-${subCategory}` },
          update: {},
          create: {
            id: `sub-${subCategory}`,
            parentId: parentCategory.id,
            companyId: company.id,
            name: subCategory,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    // 4. User ID 11 추가
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

    // 5. 장바구니 추가 (User ID 11)
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

    // 6.상품 추가
    await tx.product.createMany({
      data: products,
      skipDuplicates: true,
    });

    // 7. 주문 요청 추가 (User ID 11)
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

    // 8. 주문 요청 아이템 추가 (orderRequestItems.ts에서 import한 데이터 사용)
    await tx.orderRequestItem.createMany({
      data: orderRequestItems,
      skipDuplicates: true,
    });

    // 9. 각 주문 요청에 대해 totalAmount 계산 후 업데이트
    const orderRequestIds = ['order-1', 'order-2', 'order-3'];

    for (const orderRequestId of orderRequestIds) {
      // 해당 주문 요청의 아이템 조회
      const items = await tx.orderRequestItem.findMany({
        where: { orderRequestId },
      });

      // totalAmount 계산 (각 아이템의 price * quantity 합산)
      const totalAmount = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

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
  .finally(() => {
    void prisma.$disconnect();
  });
