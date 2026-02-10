import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class PromotionService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    getShopPromotions(shopId: string, params?: any): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/promotions/shop/${shopId}`, { params });
    }

    createPromotion(shopId: string, data: any): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/promotions/${shopId}`, data);
    }

    updatePromotion(id: string, data: any): Observable<any> {
        return this.http.put<any>(`${this.API_URL}/promotions/${id}`, data);
    }

    addProductsToPromotion(id: string, productIds: string[]): Observable<any> {
        return this.http.post<any>(`${this.API_URL}/promotions/${id}/products`, { productIds });
    }

    removeProductsFromPromotion(id: string, productIds: string[]): Observable<any> {
        return this.http.delete<any>(`${this.API_URL}/promotions/${id}/products`, { body: { productIds } });
    }
}
