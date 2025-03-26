import { BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';
import { hash } from 'argon2';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

const main = async (): Promise<void> => {
  console.log('🚀 Seeding database...');

  await prisma.$transaction(async tx => {
    // 1. Company 데이터 추가(createId() 대신 직접 값 할당)
    const companyId = 'qsch6ljzbigconazqak4jsrr';
    const userId = 'ffoilrrxetonmxiuwpcu0rqu';
    const cartId = 'bhcxqfshp43wkskocodegc7x';

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
    // const mainCategoryIds = mainCategories.map(() => createId());
    // createId() 대신 직접 값 할당
    const mainCategoryIds = [
      'hszid9zo4inokoj1jd7lpc1v',
      'm30b3i48tfj6bxi8q6adzp7h',
      'p7v2h0l9p9wwgq6s12o72kek',
      'cyxofxsgl8j37gs5ljr68xh1',
      'hvgtemwdz9m65bx1oulm9zit',
      'o4rwoey2spokdon6s9o3eegx',
      'vxtcfudytl32zphqp8znq6mk',
    ];

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

      // createId() 대신 직접 값 할당
      const subCategoryIds = [
        'd8031i1djxm1hh5rpmpv2smc',
        'd92dkfhdgrzqew1mggqpi85i',
        'q2u4n7gebefcl5x2c7y13izs',
        'sqbfvc3xrvd5vyklz1zdek0u',
        'dui1nl60on4l0oyauc626y91',
        'er59nyxlspqnwo0zedqw4jb8',
        'xc35phj5rxh4xwoyhpo3s22m',
        'vnpbw49bk4zmg58jkqhkpy47',
        'dms9un0uacysrr3bno0qrxqv',
        'yojfdrj6g9vuc3okqy2khf7w',
        'wfbn9rbjh5b3gak5vhxzbvsy',
        'jvfkhtspnr4gvmtcue6xtjxf',
        's3y6cgoyqmrll7e26re0r8t7',
        'ddi7k2g15ae3ehhpeuz3vhp4',
        'ydjk4xaq37gmm7aira2oshay',
        'l359supopxue20xs21o689vb',
        'kmlpfkmy0q2hqqyrf0m2zlj5',
        'a96ulv2sn5odt70go375ktyg',
        'k4jyuy7bspctpfe22fjbod9p',
        'omqlmk2ixhihq7z8dczja2xn',
        'jb13q0meuc71zwahw6dnmy3k',
        'c7tg5vx2w9abx59qrrc5jl1h',
        'si5qvq6vsqptcju91ur81w83',
        'az2o6o95cgxi5qsygg8c9p5h',
        'mjgygd3y3eiimd0ntot1bye4',
        's27a1zkp5wsg59i351h5bp8o',
        'c0zteiih7pxxspbq2zplkann',
        'j1nnyu46ujhnj3ojq7uyoqat',
        'j3vw47ajzq5oglc36p5j56cq',
        'y3en4uxvcfrnp397ojzt4hfx',
        'jg2dsmicc0tu9gu382g2quz2',
        'nwyouqivjjpmkl8lv7nrbkrl',
        'v6fr3fvgekxlik90tmap28rj',
        'h7ess07as8obzrjcad55vjs5',
        'dv94mxd5wo08gx29lfvub0km',
        'xgrgbkb6uvbuu8jwec7sbc2b',
        'exepgqlihw3nyiok95qn3cdx',
        'x5y3larpz80szw057mjtk046',
        'hnnz60j9vc5axx6pr34mkbvv',
        'qypndg50wp8ntv6vvukv4hrg',
        'dhwiahkj21yb0z4mr8zw6i9u',
        'p39pzponrt99da2y0u4e05j6',
        'bv6sxcr1a3ie7udxvpmrdpcb',
        'kpvjyhn71phdqx00brbky0g7',
        'ysux3yaep1960qmla0ebbb2v',
        'p2xn9oepkbr77t1rc8cd5g8j',
        'wxmdbjn1dh40bp9qrvto1ci2',
        'umbzcgnuaju4wopjktmvwdz1',
        'iymqun35enmpzd53bcmbbpc6',
      ];
      for (const [index, subCategory] of subCategoryList.entries()) {
        // const subCategoryId = createId();
        const subCategoryId = subCategoryIds[index];
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

    // const productIds = Array.from({ length: 10 }, () => createId());
    // createId() 대신 직접 값 할당
    const productIds = [
      'qbrpeogbp7bwzk57x2xed0v3',
      'awyhmhs90zk403rzj1eyi158',
      'nw02dbgfebqeqhrb8hnzvqzu',
      'qohyrtyebwvxegjrum5akyys',
      's12us3o662tyz6zqobgmadih',
      'p29ya4n0j23meovjmoscabi0',
      't5zkcght7zox4o8x7ujcsp7r',
      'a3lhkbvzo8868yot73ofqu3s',
      'ctwtlw3e6t7xebhogrii3rwe',
      'nerlv4ugv3ng3do54zepa0ia',
    ];
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

    // const orderRequestIds = Array.from({ length: 3 }, () => createId());
    // createId() 대신 직접 값 할당
    const orderRequestIds = [
      'nz2p1larko8dcbyr7ej08v98',
      'xp569x8t45rbax2m2pqhqsnl',
      'uc4os87dbme8k5gom16lqb6u',
    ];
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
    // const orderRequestItemsIds = Array.from({ length: 6 }, () => createId());
    // createId() 대신 직접 값 할당
    const orderRequestItemsIds = [
      'ux1idk821b5j1qmv6b30ncko',
      'fugejwfmuo43d7po46psreto',
      'vsqr28wsy0oxz1fzstc9s8l1',
      'iurp3qr1rffhzj9lan7sbu6c',
      'dirjv4wqu8fhb6up8n0frnzl',
      'hfe0sszybej58jdqfmqtnpgi',
    ];
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

    // 10. 우편번호(Zipcode) 추가(tsv로 불러오기)
    // FeeType은 추후 적절한 위치로 옮겨서 단일 진실 공급원(Single Source of Truth) 준수
    type FeeType = 'NOT_APPLICABLE' | 'JEJU' | 'ISOLATED';
    // 우편번호 데이터 파일 경로(seed.ts와 같은 경로)
    const filePath = path.join(__dirname, 'zipcodes.tsv');

    // 파일 존재 여부 확인
    if (!fs.existsSync(filePath)) {
      console.error(`❌ zipcodes.tsv 파일을 찾을 수 없습니다: ${filePath}`);
      return;
    }
    const zipCodesFile = fs.readFileSync(filePath, 'utf-8');

    const lines = zipCodesFile.split('\n').slice(1).filter(Boolean); // 첫 줄(헤더) 제거하고 빈 줄 필터링
    const zipcodes = lines
      .map(line => {
        const [postalCode, feeType, isActive, juso] = line.split('\t');

        // 한 줄 테스트
        console.log(
          `postalCode: ${postalCode}, feeType: ${feeType}, isActive: ${isActive}, juso: ${juso}`,
        );
        if (!postalCode || !feeType || !isActive) {
          console.error(`❌ 잘못된 데이터 형식: ${line}`);
          throw new BadRequestException(`❌ 잘못된 데이터 형식: ${line}`);
        }

        return {
          postalCode: String(postalCode.trim()), // 숫자로 인식되지 않도록 문자열로 변환(0으로 시작하는 경우 앞글자가 없어지면 안되므로)
          feeType: feeType.trim() as FeeType, // ENUM 변환(제주, 도서산간, 이외)
          isActive: isActive.trim().toLowerCase() === 'true', // 현재 활성화 여부
          juso: juso.trim(), // 주소 저장
        };
      })
      .filter((zipcode): zipcode is NonNullable<typeof zipcode> => zipcode !== null);

    console.log(`📄 TSV 데이터: ${zipcodes.length}개의 데이터 로드 완료`);

    // 우편번호 데이터 추가(도서산간지역 배송비 추가 관련)
    await tx.zipcode.createMany({
      data: zipcodes,
      skipDuplicates: true,
    });

    console.log(`📄 우편번호 데이터 추가 완료:`);

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
