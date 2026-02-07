export interface Category {
    _id: string;
    name: string;
    slug?: string;
    image?: string;
}

export interface Shop {
    _id: string;
    name: string;
    owner?: string;
}

export interface Product {
    _id: string;
    name: string;
    description: string;
    price: number;
    stock: number;
    images: string[];
    category: any;
    tags: string[];
    shop: any;
    averageRating: number;
    totalRatings: number;
    isActive: boolean;
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
