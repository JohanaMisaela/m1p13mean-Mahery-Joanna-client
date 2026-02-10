import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Shop, ShopResponse } from '../../shared/models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ShopService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    getShops(params?: any): Observable<ShopResponse> {
        return this.http.get<ShopResponse>(`${this.API_URL}/shop`, { params });
    }

    getShopById(id: string): Observable<Shop> {
        return this.http.get<Shop>(`${this.API_URL}/shop/${id}`);
    }

    getFavorites(params?: any): Observable<any> {
        return this.http.get(`${this.API_URL}/shop/my/favorites`, { params });
    }

    updateShop(id: string, data: any): Observable<Shop> {
        return this.http.put<Shop>(`${this.API_URL}/shop/${id}`, data);
    }

    updateStatus(id: string, isActive: boolean): Observable<any> {
        return this.http.patch(`${this.API_URL}/shop/${id}/status`, { isActive });
    }
}
