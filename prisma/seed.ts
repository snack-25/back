import { PrismaClient } from '@prisma/client';
import { orderRequestItems } from './const/orderRequestItems'; // orderRequestItems.ts 파일에서 데이터 임포트
import { products } from './const/products';

const prisma = new PrismaClient();

async function main(): Promise<void> {
  console.log('🚀 Seeding database...');

  await prisma.$transaction(async tx => {
    // 1. Company 데이터 추가
    const company = await tx.company.upsert({
      where: { id: 'z5c80i800p4icevy7ese41bu' },
      update: {},
      create: {
        id: 'z5c80i800p4icevy7ese41bu',
        name: '테스트 회사',
        bizno: '1234567890',
        address: '서울시 강남구 테헤란로 123',
        zipcode: '06100',
        createdAt: new Date(),
        updatedAt: new Date(),
      },
    });

    // 2. 메인 카테고리 추가
    const mainCategories = [
      { id: 'mdhsghefgm0yvlfkhv8cckqm', name: '스낵' },
      { id: 'ypz39012ftfrqwqwpvi6cy6v', name: '음료' },
      { id: 'sijsyztwpt3hm44gloj2ekof', name: '생수' },
      { id: 'nvbgq8nf3k7qinjkaeuf4tah', name: '간편식' },
      { id: 'dibby4r51eu85k6gyjgwawcz', name: '신선식품' },
      { id: 'uxshvxe2rgsxg0ujf6wsniel', name: '원두커피' },
      { id: 'jt5zmz641thhwcfhysrmtvjk', name: '비품' },
    ];

    for (const { id, name } of mainCategories) {
      await tx.category.upsert({
        where: { id },
        update: {},
        create: {
          id,
          companyId: company.id,
          name,
          isActive: true,
          createdAt: new Date(),
          updatedAt: new Date(),
        },
      });
    }

    // 3. 서브카테고리 추가
    const subCategories = {
      mdhsghefgm0yvlfkhv8cckqm: [
        { id: 'cf2pr8ygr0ouvna9nbq506je', name: '과자' },
        { id: 'bfk6a9hlzbh90uwqxo8jfg4l', name: '쿠키' },
        { id: 'aoa2lqknspar7t9gltogl8vx', name: '파이' },
        { id: 'o4krp07hbz55ofit3t9152f7', name: '초콜릿류' },
        { id: 'e4qm67ffyiy8ydldd19cg7ct', name: '캔디류' },
        { id: 'u5emt0i2adtzas9d593gcvhz', name: '껌류' },
        { id: 'm8vioh2md65l644b550to1pd', name: '비스켓류' },
        { id: 'pojkubgcli1ojmv2kqtvz172', name: '씨리얼바' },
        { id: 'hzmkeydmmvoccjkgv6kpddkm', name: '젤리류' },
        { id: 'vqjuygk55viuwd0mqbwhpn7g', name: '견과류' },
        { id: 'sk1kidpulvmyv77b24bitk5i', name: '워터젤리' },
      ],
      ypz39012ftfrqwqwpvi6cy6v: [
        { id: 'iuo1on0s7inc2kx5r0gelzex', name: '청량/탄산음료' },
        { id: 'uo2w2dum0fvp5c7a9690betv', name: '과즙음료' },
        { id: 'i1xip2sr0am2krj2q3oan244', name: '에너지음료' },
        { id: 'j5td7udp2kkcegzstdp3vc4d', name: '이온음료' },
        { id: 'bzlo0z8gmxcp56l40sox7ji9', name: '유산균음료' },
        { id: 'dnr886pjgz29gt6ctpwgicgy', name: '건강음료' },
        { id: 'z9hgjsi0nbp0qodu2tmyi4lh', name: '차류' },
        { id: 'r54t2advhfshzmj0jy7qjabj', name: '두유/우유' },
        { id: 'wg8264yj987ykcx6pgm6t22g', name: '커피' },
      ],
      sijsyztwpt3hm44gloj2ekof: [
        { id: 'oajyhulxfi066y751yhw1iuk', name: '생수' },
        { id: 'znt5w1yo2wmiljbrnpzf6wg7', name: '스파클링' },
      ],
      nvbgq8nf3k7qinjkaeuf4tah: [
        { id: 'w329r2phpcsn1emwzb4yux62', name: '봉지라면' },
        { id: 'mp4abgflpsnaswnscmuyfbjn', name: '과일' },
        { id: 'b32o7cwyvmca3pys07ijbvkr', name: '컵라면' },
        { id: 'bmlpl91l9t2lssy5nk8mk1fm', name: '핫도그 및 소시지' },
        { id: 'brtrezm2fhgrovkd6xmczijr', name: '계란' },
        { id: 'h8x4b2w9gb95fyjcfv9k5s9k', name: '죽/스프류' },
        { id: 'tkq9274bpmsk7pvz55m4ka91', name: '컵밥류' },
        { id: 'w3j0v0c1tjwqk55883hddqo6', name: '시리얼' },
        { id: 'y9n45txe4cqm6mfjyck9eg99', name: '반찬류' },
        { id: 'q0uwwo4fz2t22n3j04wmvfcd', name: '면류' },
        { id: 'korya4i5f9dbq2gatun1yxat', name: '요거트류' },
        { id: 'j9z1z7wyjt4d3ngkz9ravd52', name: '가공안주류' },
        { id: 'mgbm2snu7y210ndrn95rii3u', name: '유제품' },
      ],
      dibby4r51eu85k6gyjgwawcz: [
        { id: 'ote70z85578gzvmbomh0whkh', name: '샐러드' },
        { id: 'udcwfugibkq5boy0gguzljo8', name: '빵' },
        { id: 'zuoj5fxppc9smep1nzlun5sw', name: '햄버거/샌드위치' },
        { id: 'rbcsqy45kzdxfx3e476el4f0', name: '주먹밥/김밥' },
        { id: 'omurg5wd0smcc8780ot8082p', name: '도시락' },
      ],
      uxshvxe2rgsxg0ujf6wsniel: [
        { id: 'wrrcewfzh8ez7udldepnai6h', name: '드립커피' },
        { id: 'wdek4b93hbzaqk0wid4ql0zn', name: '원두' },
        { id: 'nbwpi5zqqbiw6cyt4p63i2pt', name: '캡슐커피' },
      ],
      jt5zmz641thhwcfhysrmtvjk: [
        { id: 'ua0sgxshn7v5linrbnr66is7', name: '커피/차류' },
        { id: 'ly3a21616z2dwo25in82coxq', name: '생활용품' },
        { id: 'x725v3mnjaq4lypgcrjknxmc', name: '일회용품' },
        { id: 'q4syqanciczpy526kaow8nm8', name: '사무용품' },
        { id: 'fcz1o8mrd877cxu0z0jgmcp1', name: '카페용품' },
        { id: 'b1edqeyeb295wrykbidtce6p', name: '일회용품(친환경)' },
      ],
    };

    for (const [mainCategoryId, subCategoryList] of Object.entries(subCategories)) {
      const parentCategory = await tx.category.findUnique({
        where: { id: mainCategoryId },
      });

      if (!parentCategory) {
        console.error(`❌ 메인 카테고리를 찾을 수 없습니다: ${mainCategoryId}`);
        continue;
      }

      for (const subCategory of subCategoryList) {
        await tx.category.upsert({
          where: { id: subCategory.id },
          update: {},
          create: {
            id: subCategory.id,
            parentId: parentCategory.id,
            companyId: company.id,
            name: subCategory.name,
            isActive: true,
            createdAt: new Date(),
            updatedAt: new Date(),
          },
        });
      }
    }

    // 4. User ID 11 추가
    const user11 = await tx.user.upsert({
      where: { id: 'vrtp62c4yiac6hog8ximorcy' },
      update: {},
      create: {
        id: 'vrtp62c4yiac6hog8ximorcy',
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
      where: { id: 'rbh4ib2mt2pt5175wuf9wsz6' },
      update: {},
      create: {
        id: 'rbh4ib2mt2pt5175wuf9wsz6',
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
          id: 'ynf7ggigzi49nw950fvtb69w',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'au38gwt16z0gruclcdl7q3dz',
          requesterId: user11.id,
          companyId: company.id,
          status: 'PENDING',
          totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
          createdAt: new Date(),
          updatedAt: new Date(),
        },
        {
          id: 'tsnrxxdcnh8z0o8bx7bp6hk8',
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
    const orderRequestIds = [
      'ynf7ggigzi49nw950fvtb69w',
      'au38gwt16z0gruclcdl7q3dz',
      'tsnrxxdcnh8z0o8bx7bp6hk8',
    ];

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
