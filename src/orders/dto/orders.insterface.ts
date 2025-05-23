export interface OrderDetailItem {
  productId: string;
  productName: string;
  imageUrl: string | null;
  price: number;
  quantity: number;
  categoryId: string | null;
  categoryName: string | null;
}

export interface OrderDetailResponse {
  id: string;
  orderNumber: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSING';
  totalAmount: number;
  shippingMethod: string;
  adminNotes: string | null;
  notes: string | null;
  createdAt: string;
  updatedAt: string;
  deliveredAt: string | null;
  shippedAt: string | null;
  trackingNumber: string | null;
  requestedBy: {
    id: string;
    name: string;
  };
  updatedBy: {
    id: string;
    name: string;
  };
  orderItems: {
    productId: string;
    productName: string;
    imageUrl: string;
    price: number;
    quantity: number;
    categoryId: string | null;
    categoryName: string | null;
  }[];
}
