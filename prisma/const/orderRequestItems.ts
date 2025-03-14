// orderRequestItems.ts
import { products } from './products'; // 상품 데이터를 임포트

export const orderRequestItems = [
  {
    id: 'item-1',
    orderRequestId: 'order-1',
    productId: products[0].id,
    quantity: 2,
    price: products[0].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-2',
    orderRequestId: 'order-1',
    productId: products[1].id,
    quantity: 3,
    price: products[1].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-3',
    orderRequestId: 'order-2',
    productId: products[1].id,
    quantity: 1,
    price: products[1].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-4',
    orderRequestId: 'order-2',
    productId: products[2].id,
    quantity: 3,
    price: products[2].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-5',
    orderRequestId: 'order-2',
    productId: products[3].id,
    quantity: 4,
    price: products[3].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'item-6', // item-5는 중복되지 않도록 id 변경
    orderRequestId: 'order-3',
    productId: products[1].id,
    quantity: 2,
    price: products[1].price,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
];
