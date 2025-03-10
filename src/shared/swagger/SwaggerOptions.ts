import { DocumentBuilder, OpenAPIObject, SwaggerCustomOptions } from '@nestjs/swagger';

const swaggerCustomOptions = (): SwaggerCustomOptions => ({ customSiteTitle: '스낵25 API' });

const swaggerOption = (): Omit<OpenAPIObject, 'paths'> => {
  const options = new DocumentBuilder()
    .setTitle('스낵25 API')
    .setDescription('스낵25 API 명세서')
    .setVersion('1.0')
    .addTag('Auth', '인증 관리')
    .addTag('Budgets', '예산 관리')
    .addTag('Carts', '장바구니 관리')
    .addTag('Categories', '카테고리 관리')
    .addTag('Companies', '기업 관리')
    .addTag('Invitations', '초대 관리')
    .addTag('OrderRequests', '주문 요청 관리')
    .addTag('Products', '상품 관리')
    .addTag('Orders', '주문 관리')
    .addTag('Users', '사용자 관리')
    .build();

  return options;
};

const docsOptions = {
  swagger: swaggerOption,
  swaggerCustom: swaggerCustomOptions,
};

export default docsOptions;
