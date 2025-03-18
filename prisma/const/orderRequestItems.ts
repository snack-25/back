// orderRequestItems.ts
import { products } from './products'; // 상품 데이터를 임포트

export const orderRequestItems = [
  {
    id: 'olhupsw07eaku99fidwkf4o2',
    orderRequestId: 'ynf7ggigzi49nw950fvtb69w',
    productId: products[0].id,
    quantity: 2,
    price: products[0].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'dmbk5nky6e0vqa14pryhnhs0',
    orderRequestId: 'ynf7ggigzi49nw950fvtb69w',
    productId: products[1].id,
    quantity: 3,
    price: products[1].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 't44ji6rafdhlk4ucj4rddm8p',
    orderRequestId: 'au38gwt16z0gruclcdl7q3dz',
    productId: products[1].id,
    quantity: 1,
    price: products[1].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'i90uu5srquux03yirs8l7fug',
    orderRequestId: 'au38gwt16z0gruclcdl7q3dz',
    productId: products[2].id,
    quantity: 3,
    price: products[2].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'voevo18c2rsj8f0h4yunfiir',
    orderRequestId: 'au38gwt16z0gruclcdl7q3dz',
    productId: products[3].id,
    quantity: 4,
    price: products[3].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'pmyy48yu25ef0uvqult9dd0i',
    orderRequestId: 'tsnrxxdcnh8z0o8bx7bp6hk8',
    productId: products[1].id,
    quantity: 2,
    price: products[1].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
