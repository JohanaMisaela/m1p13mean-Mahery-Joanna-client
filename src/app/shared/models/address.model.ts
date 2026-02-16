export interface UserAddress {
    _id: string;
    user: string;
    street: string;
    city: string;
    zip: string;
    country: string;
    isDefault: boolean;
    isActive: boolean;
    createdAt: string;
    updatedAt: string;
}

export interface AddressResponse {
    data: UserAddress[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}

export interface CreateAddressDto {
    street: string;
    city: string;
    zip: string;
    country: string;
    isDefault?: boolean;
}
