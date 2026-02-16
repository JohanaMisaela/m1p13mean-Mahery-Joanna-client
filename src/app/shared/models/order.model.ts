export interface OrderItem {
    product: any; // Ideally should be Product interface
    variant?: any; // Ideally should be ProductVariant interface
    quantity: number;
    price: number;
    originalPrice: number;
    promotion?: string;
    // ... possibly other fields, or populated fields
}

export interface Order {
    _id: string;
    user: any; // Ideally should be User interface
    shop: any; // Ideally should be Shop interface
    items: OrderItem[];
    totalAmount: number;
    shippingAddress: any; // UserAddress interface
    status: 'PENDING' | 'CONFIRMED' | 'SHIPPED' | 'CANCELLED';
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
