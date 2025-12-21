import { BadRequestException, Logger } from '@nestjs/common';
import type {
  Budget,
  Cart,
  Category,
  Company,
  CompanyAddress,
  FeeType,
  Product,
  User,
} from '@prisma/client';
import { PrismaClient } from '@prisma/client';
import { PrismaClientKnownRequestError } from '@prisma/client/runtime/library';
import { createHash } from 'crypto';
import fs from 'fs';
import path from 'path';
import { loadJsonFile } from './loadJsonFile';

const isDevelopment = process.env.NODE_ENV === 'development';
const ERROR_MESSAGES = {
  USER_ID_NOT_FOUND: '사용자 ID가 존재하지 않습니다.',
  COMPANY_ID_NOT_FOUND: '회사 ID가 존재하지 않습니다.',
  REQUESTER_ID_NOT_FOUND: '요청자 ID가 존재하지 않습니다.',
};

const prisma = new PrismaClient();

const companies = loadJsonFile<Company[]>('companies.json');
const companyAddresses = loadJsonFile<CompanyAddress[]>('company-addresses.json');
const categories = loadJsonFile<Category[]>('categories.json');
const subCategories = loadJsonFile<Category[]>('sub-categories.json');
const users = loadJsonFile<User[]>('users.json');
const products = loadJsonFile<Product[]>('products.json');
const budgets = loadJsonFile<Budget[]>('budgets.json');
const carts = loadJsonFile<Cart[]>('carts.json');

const getRequiredId = <T extends { id: string }>(
  entity: T | undefined,
  errorMessage: string,
): string => {
  if (!entity?.id) {
    throw new BadRequestException(errorMessage);
  }
  return entity.id;
};

const main = async (): Promise<void> => {
  Logger.log('🚀 데이터베이스를 시딩중입니다...');

  // 0. 우편번호(Zipcode) 추가(데이터가 많아 별도 트랜잭션으로 처리함)
  await prisma.$transaction(
    async tx => {
      try {
        // 우편번호 데이터 파일 경로(seed.ts와 같은 경로)
        const filePath = path.join(__dirname, 'zipcodes.tsv');

        // 파일 존재 여부 확인
        if (!fs.existsSync(filePath)) {
          throw new BadRequestException(`❌ zipcodes.tsv 파일을 찾을 수 없습니다: ${filePath}`);
        }
        const zipCodesFile = fs.readFileSync(filePath, 'utf-8');

        const lines = zipCodesFile.split('\n').slice(1).filter(Boolean); // 첫 줄(헤더) 제거하고 빈 줄 필터링
        const zipcodes = lines
          .map(line => {
            const [postalCode, feeType, isActive, juso] = line.split('\t');

            // 개발 환경에서는 우편번호 데이터 로깅
            if (isDevelopment) {
              Logger.log(
                `우편번호 데이터: ${postalCode}, 배송비 유형: ${feeType}, 활성 상태: ${isActive}, 주소: ${juso}`,
              );
            }
            if (!postalCode || !feeType || !isActive || !juso) {
              Logger.error(`❌ 잘못된 데이터 형식: ${line}`);
              throw new BadRequestException(`❌ 잘못된 데이터 형식: ${line}`);
            }

            return {
              postalCode: String(postalCode.trim()), // 숫자로 인식되지 않도록 문자열로 변환(0으로 시작하는 경우 앞글자가 없어지면 안되므로)
              feeType: feeType.trim() as FeeType, // 배송비 유형(제주, 도서산간, 이외), @prisma/client에 정의된 타입 사용
              isActive: isActive.trim().toLowerCase() === 'true', // 현재 활성화 여부
              juso: juso.trim(), // 주소 저장
            };
          })
          .filter((zipcode): zipcode is NonNullable<typeof zipcode> => zipcode !== null);

        Logger.log(`📄 TSV 데이터: ${zipcodes.length}개의 데이터 로드 완료`);

        // 우편번호 데이터 추가(도서산간지역 배송비 추가 관련)
        const existingZipcode = await tx.zipcode.aggregate({
          _count: { id: true },
        });

        if (existingZipcode._count.id === 0) {
          // DB에 데이터가 없는 경우 새로운 데이터 추가
          await tx.zipcode.createMany({
            data: zipcodes,
            skipDuplicates: true,
          });
          Logger.log('🎉 우편번호 데이터가 없어 새로 생성했습니다.');
        } else {
          // 데이터 해시 함수
          const hashData = (
            data: { postalCode: string; feeType: FeeType; isActive: boolean }[],
          ): string => {
            return createHash('sha256')
              .update(
                JSON.stringify(
                  data.map(d => ({
                    postalCode: d.postalCode,
                    feeType: d.feeType,
                    isActive: d.isActive,
                  })),
                ),
              )
              .digest('hex');
          };

          // DB 데이터와 새 데이터의 해시 비교
          const existingDataHash = hashData(await tx.zipcode.findMany());
          const newDataHash = hashData(zipcodes);
          const hasChanges = existingDataHash !== newDataHash;

          if (hasChanges) {
            // company_addresses 테이블의 zipcodeId를 null로 설정
            await tx.companyAddress.updateMany({
              where: {},
              data: { zipcodeId: null },
            });

            // zipcode 테이블 데이터 삭제
            await tx.zipcode.deleteMany();

            // 새로운 데이터 추가
            await tx.zipcode.createMany({
              data: zipcodes,
              skipDuplicates: true,
            });

            Logger.log('🎉 우편번호 데이터가 변경되어 업데이트했습니다.');
          } else {
            Logger.log(
              '🎉 우편번호 데이터가 모두 있어 테이블에 있는 데이터를 삭제하지 않았습니다.',
            );
          }
        }

        Logger.log(`📄 우편번호 데이터 추가 완료`);
      } catch (error) {
        Logger.error('❌ 우편번호 데이터 추가 중 오류 발생:', error);
        throw error;
      }
    },
    { timeout: 30000 }, // 트랜잭션 타임아웃 30초 설정
  );

  await prisma.$transaction(
    async tx => {
      try {
        // 1. 기업 데이터 및 기업 주소 데이터 추가
        // 아래 다른 테이블 입력을 위해 테스트 기업 선택
        const testCompany: Company = companies[0];

        // const loginEmail = 'mandely@naver.com'; // ← 네가 로그인에 쓸 이메일
        // const loginUser = users.find(u => u.email === loginEmail);
        // if (!loginUser?.companyId) {
        //   throw new BadRequestException('로그인 유저의 companyId를 찾을 수 없습니다.');
        // }
        // const testCompany = companies.find(c => c.id === loginUser.companyId);
        // if (!testCompany) {
        //   throw new BadRequestException('로그인 유저 회사가 companies.json에 없습니다.');
        // }

        // 1-1. 기업 생성
        await tx.company.createMany({
          data: companies,
          skipDuplicates: true,
        });

        // 1-2. 기업 주소 생성
        // 우편번호 데이터를 한 번에 가져와서 메모리에 캐싱
        const allZipcodes = await tx.zipcode.findMany();
        const zipCodeMap = new Map(allZipcodes.map(z => [`${z.postalCode}-${z.juso}`, z]));

        // 배치 처리를 위한 데이터 준비
        const addressesToCreate = companyAddresses.map(address => {
          const { companyId, zipcodeId: _zipcodeId, ...rest } = address;
          const key = `${address.postalCode}-${address.address}`;
          const matchingZipcode = zipCodeMap.get(key);

          return {
            ...rest,
            companyId, // companyId를 직접 지정
            ...(matchingZipcode ? { zipcodeId: matchingZipcode.id } : {}),
          };
        });

        // 배치 생성
        await tx.companyAddress.createMany({
          data: addressesToCreate,
          skipDuplicates: true,
        });

        const parentCategories: Category[] = categories.map(category => ({
          ...category,
          companyId: testCompany.id,
        }));
        if (categories.length === 0) {
          throw new BadRequestException('Categories not found');
        }
        await tx.category.createMany({
          data: parentCategories,
          skipDuplicates: true,
        });
        Logger.log(`📁 상위 카테고리 ${parentCategories.length}개의 데이터 추가 완료`);

        const subCategoriesWithCompany: Category[] = subCategories.map(category => ({
          ...category,
          companyId: testCompany.id,
        }));
        Logger.log(`📂 하위 카테고리 ${subCategoriesWithCompany.length}개의 데이터 추가 완료`);

        if (subCategories.length === 0) {
          throw new BadRequestException('SubCategories not found');
        }
        await tx.category.createMany({
          data: subCategoriesWithCompany,
          skipDuplicates: true,
        });

        await tx.user.createMany({
          data: users,
          skipDuplicates: true,
        });
        Logger.log(`👤 사용자 ${users.length}개의 데이터 추가 완료`);

        await tx.product.createMany({
          data: products,
          skipDuplicates: true,
        });
        Logger.log(`📦 제품 ${products.length}개의 데이터 추가 완료`);

        await tx.cart.createMany({
          data: carts,
          skipDuplicates: true,
        });

        Logger.log(`🛒 유저 정보가 추가된 장바구니 ${carts.length}개의 데이터 추가 완료`);

        // 변경 전 코드

        // 7. 주문 요청 추가
        const orderRequestIds = [
          'nz2p1larko8dcbyr7ej08v98',
          'xp569x8t45rbax2m2pqhqsnl',
          'uc4os87dbme8k5gom16lqb6u',
        ];
        await tx.orderRequest.createMany({
          data: [
            {
              id: orderRequestIds[0],
              requesterId: getRequiredId(users[0], ERROR_MESSAGES.REQUESTER_ID_NOT_FOUND),
              companyId: getRequiredId(testCompany, ERROR_MESSAGES.COMPANY_ID_NOT_FOUND),
              status: 'PENDING',
              totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: orderRequestIds[1],
              requesterId: getRequiredId(users[6], ERROR_MESSAGES.REQUESTER_ID_NOT_FOUND),
              companyId: getRequiredId(testCompany, ERROR_MESSAGES.COMPANY_ID_NOT_FOUND),
              status: 'APPROVED',
              totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
              createdAt: new Date(),
              updatedAt: new Date(),
            },
            {
              id: orderRequestIds[2],
              requesterId: getRequiredId(users[1], ERROR_MESSAGES.REQUESTER_ID_NOT_FOUND),
              companyId: getRequiredId(testCompany, ERROR_MESSAGES.COMPANY_ID_NOT_FOUND),
              status: 'REJECTED',
              totalAmount: 0, // 초기값은 0으로 설정, 나중에 계산하여 덮어씀
              createdAt: new Date(),
              updatedAt: new Date(),
            },
          ],
          skipDuplicates: true,
        });

        // 8. 주문 요청 아이템 추가
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

        // 기존 아이템 ID 목록 조회
        const existingItemIds = new Set(
          (
            await tx.orderRequestItem.findMany({
              where: { id: { in: orderRequestItems.map(item => item.id) } },
              select: { id: true },
            })
          ).map(item => item.id),
        );

        // 존재하지 않는 아이템만 필터링하여 생성
        const itemsToCreate = orderRequestItems.filter(item => !existingItemIds.has(item.id));
        if (itemsToCreate.length > 0) {
          await Promise.all(itemsToCreate.map(item => tx.orderRequestItem.create({ data: item })));
        }

        // 9. 각 주문 요청에 대해 totalAmount 계산 후 업데이트
        // 모든 주문 요청 아이템을 한 번에 조회
        const allOrderItems = await tx.orderRequestItem.findMany({
          where: { orderRequestId: { in: orderRequestIds } },
        });

        // 주문별 총액 계산
        const orderTotals = allOrderItems.reduce(
          (acc, item) => {
            const orderId = item.orderRequestId;
            if (!acc[orderId]) acc[orderId] = 0;
            acc[orderId] += item.price * item.quantity;
            return acc;
          },
          {} as Record<string, number>,
        );

        // 모든 주문 총액 한 번에 업데이트
        await Promise.all(
          Object.entries(orderTotals).map(([orderRequestId, totalAmount]) =>
            tx.orderRequest.update({
              where: { id: orderRequestId },
              data: { totalAmount },
            }),
          ),
        );

        // 10. Budget 데이터 추가
        if (budgets.length > 0) {
          // CUID2 형식 검증 함수
          const isValidCuid2 = (id: string): boolean => {
            return /^[a-z0-9]{24}$/.test(id);
          };

          // 잘못된 ID를 가진 Budget 데이터 찾기
          const invalidBudgets = await tx.budget.findMany({
            where: {
              NOT: {
                id: {
                  in: budgets.filter(b => isValidCuid2(b.id)).map(b => b.id),
                },
              },
            },
            select: { id: true },
          });

          // 잘못된 ID를 가진 데이터 삭제
          if (invalidBudgets.length > 0) {
            await tx.budget.deleteMany({
              where: {
                id: { in: invalidBudgets.map(b => b.id) },
              },
            });
            Logger.log(`💰 잘못된 ID를 가진 Budget 데이터 ${invalidBudgets.length}개 삭제 완료`);
          }

          // 새로운 Budget 데이터 생성
          const newBudgets = budgets.filter(b => !isValidCuid2(b.id));
          if (newBudgets.length > 0) {
            await tx.budget.createMany({
              data: newBudgets,
              skipDuplicates: true,
            });
            Logger.log(`💰 Budget 데이터 ${newBudgets.length}개 추가 완료`);
          } else {
            Logger.log(`💰 모든 Budget 데이터가 유효하므로 추가하지 않았습니다.`);
          }
        } else {
          Logger.warn('⚠️ Budget JSON 데이터가 비어있습니다.');
        }

        Logger.log('🎉 데이터베이스 시딩이 완료되었습니다!');
      } catch (error) {
        if (error instanceof BadRequestException) {
          Logger.error('❌ 입력 데이터 오류:', error.message);
        } else if (error instanceof PrismaClientKnownRequestError) {
          Logger.error('❌ Prisma 요청 오류:', error.message, error.code);
        } else {
          Logger.error('❌ 데이터베이스 시딩 중 알 수 없는 오류 발생:', error);
        }
        throw error;
      }
    },
    { timeout: 30000 }, // 트랜잭션 타임아웃 30초 설정
  );
};

main()
  .catch(e => {
    Logger.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(() => {
    void prisma.$disconnect();
  });
