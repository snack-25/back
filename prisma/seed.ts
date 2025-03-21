import { createId } from '@paralleldrive/cuid2';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  console.log('🚀 Seeding database...');

  await prisma.$transaction(async tx => {
    // 1. Company 데이터 추가
    const companyId = createId();
    const userId = createId();
    const cartId = createId();

    const company = await tx.company.upsert({
      where: { id: companyId },
      update: {},
      create: {
        id: companyId,
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
    const mainCategoryIds = mainCategories.map(() => createId());

    for (const [index, category] of mainCategories.entries()) {
      await tx.category.upsert({
        where: { id: mainCategoryIds[index] },
        update: {},
        create: {
          id: mainCategoryIds[index],
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
    // const subCategoryIds = Object.values(subCategories).flatMap(list => list.map(() => createId()));

    // 서브카테고리 ID 매핑을 위한 객체
    const categoryIdMap = new Map<string, string>();

    for (const [mainCategory, subCategoryList] of Object.entries(subCategories)) {
      const mainCategoryIndex = mainCategories.indexOf(mainCategory);
      const parentCategory = await tx.category.findUnique({
        where: { id: mainCategoryIds[mainCategoryIndex] },
      });

      if (!parentCategory) {
        console.error(`❌ 메인 카테고리를 찾을 수 없습니다: ${mainCategory}`);
        continue;
      }

      for (const subCategory of subCategoryList) {
        const subCategoryId = createId();
        categoryIdMap.set(subCategory, subCategoryId);

        await tx.category.upsert({
          where: { id: subCategoryId },
          update: {},
          create: {
            id: subCategoryId,
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

    // 4. User11 추가
    const user11 = await tx.user.upsert({
      where: { id: userId },
      update: {},
      create: {
        id: userId,
        companyId: company.id,
        email: 'user11@example.com',
        password: await hash('hashedpassword11'),
        name: '유저11호',
        role: 'USER',
        // refreshToken: null, // 기본값이 nullable이므로 생략
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 5. 장바구니 추가 (User11)
    await tx.cart.upsert({
      where: { id: cartId },
      update: {},
      create: {
        id: cartId,
        userId: user11.id,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 6.상품 추가

    const productIds = Array.from({ length: 10 }, () => createId());
    const products = [
      {
        id: productIds[0],
        categoryId: categoryIdMap.get('과자'),
        name: '허니버터칩',
        price: 1500,
        description: '달콤한 허니버터 맛이 일품인 과자',
        imageUrl: 'https://placehold.co/600x400?text=honeybutter',
      },
      {
        id: productIds[1],
        categoryId: categoryIdMap.get('청량/탄산음료'),
        name: '콜라',
        price: 2000,
        description: '시원한 탄산음료',
        imageUrl: 'https://placehold.co/600x400?text=cola',
      },
      {
        id: productIds[2],
        categoryId: categoryIdMap.get('생수'),
        name: '삼다수 2L',
        price: 1200,
        description: '제주 화산암반수로 만든 생수',
        imageUrl: 'https://placehold.co/600x400?text=water',
      },
      {
        id: productIds[3],
        categoryId: categoryIdMap.get('컵라면'),
        name: '신라면 컵',
        price: 1300,
        description: '매콤한 국물이 일품인 컵라면',
        imageUrl: 'https://placehold.co/600x400?text=cupnoodle',
      },
      {
        id: productIds[4],
        categoryId: categoryIdMap.get('샐러드'),
        name: '닭가슴살 샐러드',
        price: 6500,
        description: '신선한 채소와 닭가슴살이 들어간 건강한 샐러드',
        imageUrl: 'https://placehold.co/600x400?text=salad',
      },
      {
        id: productIds[5],
        categoryId: categoryIdMap.get('원두'),
        name: '에티오피아 예가체프',
        price: 25000,
        description: '꽃향이 풍부한 에티오피아 원두',
        imageUrl: 'https://placehold.co/600x400?text=coffee+bean',
      },
      {
        id: productIds[6],
        categoryId: categoryIdMap.get('일회용품'),
        name: '종이컵 6.5oz (50개입)',
        price: 3000,
        description: '무형광 친환경 종이컵',
        imageUrl: 'https://placehold.co/600x400?text=paper+cup',
      },
      {
        id: productIds[7],
        categoryId: categoryIdMap.get('과일'),
        name: '제주 감귤 1kg',
        price: 8900,
        description: '새콤달콤한 제주 감귤',
        imageUrl: 'https://placehold.co/600x400?text=tangerine',
      },
      {
        id: productIds[8],
        categoryId: categoryIdMap.get('초콜릿류'),
        name: '다크초콜릿 70%',
        price: 4500,
        description: '카카오 함량 70%의 프리미엄 다크초콜릿',
        imageUrl: 'https://placehold.co/600x400?text=chocolate',
      },
      {
        id: productIds[9],
        categoryId: categoryIdMap.get('차류'),
        name: '캐모마일 티백 20개입',
        price: 5500,
        description: '릴렉싱에 도움을 주는 캐모마일차',
        imageUrl: 'https://placehold.co/600x400?text=chamomile',
      },
    ]
      .map((product, index) => ({
        ...product,
        id: productIds[index],
      }))
      .filter(product => {
        if (!product.categoryId) {
          console.error(`❌ 카테고리를 찾을 수 없습니다: ${product.name}`);
          return false;
        }
        return true;
      });
    await tx.product.createMany({
      data: products as {
        id: string;
        categoryId: string;
        name: string;
        price: number;
        description: string;
        imageUrl: string;
      }[],
      skipDuplicates: true,
    });

    // 7. 주문 요청 추가 (User ID 11)
    const orderRequestIds = Array.from({ length: 3 }, () => createId());
    await tx.orderRequest.createMany({
      data: [
        {
          id: orderRequestIds[0],
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: orderRequestIds[1],
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: orderRequestIds[2],
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
    const orderRequestItemsIds = Array.from({ length: 6 }, () => createId());
    const orderRequestItems = [
      {
        id: orderRequestItemsIds[0],
        orderRequestId: orderRequestIds[0],
        productId: products[0].id,
        quantity: 2,
        price: products[0].price,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: orderRequestItemsIds[1],
        orderRequestId: orderRequestIds[0],
        productId: products[1].id,
        quantity: 3,
        price: products[1].price,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: orderRequestItemsIds[2],
        orderRequestId: orderRequestIds[1],
        productId: products[1].id,
        quantity: 1,
        price: products[1].price,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: orderRequestItemsIds[3],
        orderRequestId: orderRequestIds[1],
        productId: products[2].id,
        quantity: 3,
        price: products[2].price,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: orderRequestItemsIds[4],
        orderRequestId: orderRequestIds[1],
        productId: products[3].id,
        quantity: 4,
        price: products[3].price,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      {
        id: orderRequestItemsIds[5],
        orderRequestId: orderRequestIds[2],
        productId: products[1].id,
        quantity: 2,
        price: products[1].price,
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    ].map((item, index) => ({
      ...item,
      id: orderRequestItemsIds[index],
    }));

    await tx.orderRequestItem.createMany({
      data: orderRequestItems,
      skipDuplicates: true,
    });

    // 9. 각 주문 요청에 대해 totalAmount 계산 후 업데이트
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
};

main()
  .catch(e => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
