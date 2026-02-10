export interface User {
    id: string;
    _id?: string;
    name: string;
    surname?: string;
    email: string;
    contact?: string;
    role: 'admin' | 'shop' | 'user' | 'buyer';
    isActive?: boolean;
}

export interface AuthResponse {
    user: User;
    token: string;
}

export interface LoginRequest {
    email: string;
    password: string;
}

export interface RegisterRequest {
    name: string;
    surname?: string;
    email: string;
    password: string;
    contact?: string;
    role?: 'admin' | 'shop' | 'user';
}

export interface UserAddress {
    id?: string;
    _id?: string; // Backend uses _id
    street: string;
    city: string;
    zip: string;
    country: string;
    isDefault?: boolean;
}

export interface UpdateProfileRequest {
    name?: string;
    surname?: string;
    email?: string;
}

export interface ChangePasswordRequest {
    currentPassword: string;
    newPassword: string;
}

export interface UserResponse {
    data: User[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
}
