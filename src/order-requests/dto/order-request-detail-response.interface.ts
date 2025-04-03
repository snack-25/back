import { OrderRequestStatus } from '@prisma/client';

export interface OrderRequestDetailResponse {
  requesterId: string;
  status: OrderRequestStatus;
  requestedAt: Date;
  resolvedAt: Date | null;
  resolverMessage: string | null;
  requesterName: string;
  resolverName: string | null;
  items: {
    productName: string;
    categoryId: string | null;
    categoryName: string;
    imageUrl: string | null;
    quantity: number;
    price: number;
    requestMessage: string | null;
  }[];
}

export interface OrderRequestItemDto {
  price: number;
  product: {
    name: string;
    imageUrl: string | null;
  };
}

export interface OrderRequestResponseDto {
  id: string;
  status: OrderRequestStatus;
  totalAmount: number;
  requestedAt: Date;
  requesterId: string;
  resolverId: string | null;
  resolvedAt: Date | null;
  resolverMessage: string | null;
  companyId: string;
  orderRequestItems: OrderRequestItemDto[];
}
