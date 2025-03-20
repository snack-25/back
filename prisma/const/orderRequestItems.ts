// orderRequestItems.ts
import { createId } from '@paralleldrive/cuid2';
import { products } from './products'; // 상품 데이터를 임포트

export const orderRequestIds = [createId(), createId(), createId()];
export const orderRequestItemsIds = Array.from({ length: 6 }, () => createId());

export const orderRequestItems = [
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
