export interface Category {
    _id: string;
    name: string;
    slug?: string;
    image?: string;
}

export interface Shop {
    _id: string;
    name: string;
    description?: string;
    owner?: any;
    gallery?: string[];
    slogan?: string;
    mallBoxNumber?: string;
    phone?: string;
    email?: string;
    isActive?: boolean;
}

export interface ProductVariant {
    _id: string;
    product: string;
    attributes: { [key: string]: string };
    price: number;
    stock: number;
    sku?: string;
    images: string[];
    isActive: boolean;
}

export interface Product {
    _id: string;
    name: string;
    description: string;
    price?: number;
    stock?: number;
    images?: string[];
    category: any;
    tags: string[];
    shop: any;
    averageRating: number;
    totalRatings: number;
    isActive: boolean;
    favoritedBy?: string[];
    isOnSale?: boolean;
    activePromotion?: {
        discountPercentage: number;
        name: string;
        endDate: string;
    };
    attributeConfig?: { [key: string]: string[] };
    variants?: ProductVariant[];
    createdAt?: string;
    updatedAt?: string;
}

export interface ProductResponse {
    data: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface ShopResponse {
    data: Shop[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
