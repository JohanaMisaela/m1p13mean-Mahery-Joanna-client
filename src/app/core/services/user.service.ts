import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators'; // Added for the map operator
import { environment } from '../../../environments/environment';
import { User, UserAddress, UpdateProfileRequest, ChangePasswordRequest, RegisterRequest, UserResponse } from '../../shared/models/user.model';

@Injectable({
    providedIn: 'root'
})
export class UserService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    /**
     * Get current user profile
     */
    getProfile(): Observable<User> {
        return this.http.get<User>(`${this.API_URL}/user/me`);
    }

    /**
     * Update user profile
     */
    updateProfile(data: UpdateProfileRequest): Observable<User> {
        return this.http.put<User>(`${this.API_URL}/user/update`, data);
    }

    /**
     * Get user addresses
     */
    getAddresses(): Observable<UserAddress[]> {
        return this.http.get<{ data: UserAddress[] }>(`${this.API_URL}/addresses`)
            .pipe(map(response => response.data));
    }

    /**
     * Add new address
     */
    addAddress(data: UserAddress): Observable<UserAddress> {
        return this.http.post<UserAddress>(`${this.API_URL}/addresses`, data);
    }

    /**
     * Change password
     */
    changePassword(data: ChangePasswordRequest): Observable<void> {
        return this.http.put<void>(`${this.API_URL}/user/change-password`, data);
    }

    /**
     * Set address as default
     */
    setDefaultAddress(id: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/addresses/${id}/default`, {});
    }

    /**
     * Delete address (set as inactive)
     */
    deleteAddress(id: string): Observable<any> {
        return this.http.patch(`${this.API_URL}/addresses/${id}/status`, { isActive: false });
    }

    /**
     * Get all users (Admin only)
     */
    getAllUsers(params?: any): Observable<UserResponse> {
        return this.http.get<UserResponse>(`${this.API_URL}/user/all`, { params });
    }

    /**
     * Create fresh user (Admin only)
     */
    createUser(data: RegisterRequest): Observable<User> {
        return this.http.post<User>(`${this.API_URL}/auth/register`, data);
    }

    /**
     * Update user information (Admin only or self)
     */
    updateUserData(id: string, data: Partial<User>): Observable<User> {
        return this.http.put<User>(`${this.API_URL}/user/${id}`, data);
    }

    /**
     * Update user status (Admin only)
     */
    updateUserStatus(id: string, isActive: boolean): Observable<any> {
        return this.http.put(`${this.API_URL}/user/update-status/${id}`, { isActive });
    }
}
