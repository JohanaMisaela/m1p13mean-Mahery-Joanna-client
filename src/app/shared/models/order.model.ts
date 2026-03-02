export interface OrderItem {
  _id: string;
  product: any; // Ideally should be Product interface
  variant?: any; // Ideally should be ProductVariant interface
  quantity: number;
  price: number;
  originalPrice: number;
  promotion?: {
    _id: string;
    name: string;
    discountPercentage: number;
  };
  promotionName?: string;
  promotionDiscount?: number;
}

export interface Order {
  _id: string;
  user: any; // Ideally should be User interface
  shop: any; // Ideally should be Shop interface
  items: OrderItem[];
  totalAmount: number;
  shippingAddress: any; // UserAddress interface
  status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED' | 'REJECTED';
  createdAt: string;
  updatedAt: string;
}

export interface OrderResponse {
  data: Order[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}
