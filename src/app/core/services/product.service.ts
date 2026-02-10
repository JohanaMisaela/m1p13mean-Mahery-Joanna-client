import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Product, ProductResponse } from '../../shared/models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ProductService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    getProducts(params?: any): Observable<ProductResponse> {
        let httpParams = new HttpParams();

        if (params) {
            Object.keys(params).forEach(key => {
                if (params[key] !== null && params[key] !== undefined && params[key] !== '') {
                    httpParams = httpParams.append(key, params[key]);
                }
            });
        }

        return this.http.get<ProductResponse>(`${this.API_URL}/products`, { params: httpParams });
    }

    getProduct(id: string): Observable<Product> {
        return this.http.get<Product>(`${this.API_URL}/products/${id}`);
    }

    // Comments
    getComments(productId: string, params?: any): Observable<any> {
        return this.http.get(`${this.API_URL}/product-comments/${productId}`, { params });
    }

    addComment(productId: string, data: { comment: string, images?: string[] }): Observable<any> {
        return this.http.post(`${this.API_URL}/product-comments/${productId}`, data);
    }

    updateComment(commentId: string, data: { comment?: string, images?: string[] }): Observable<any> {
        return this.http.put(`${this.API_URL}/product-comments/${commentId}`, data);
    }

    deleteComment(commentId: string): Observable<any> {
        return this.http.delete(`${this.API_URL}/product-comments/${commentId}`);
    }

    toggleProductFavorite(productId: string, favorite: boolean): Observable<any> {
        return this.http.post(`${this.API_URL}/products/${productId}/favorite`, { favorite });
    }

    // Ratings
    rateProduct(productId: string, rating: number): Observable<any> {
        return this.http.post(`${this.API_URL}/product-ranking/${productId}`, { rating });
    }

    getMyRating(productId: string): Observable<any> {
        return this.http.get(`${this.API_URL}/product-ranking/my/${productId}`);
    }

    // Reports
    reportProduct(productId: string, data: { reason: string, description?: string }): Observable<any> {
        return this.http.post(`${this.API_URL}/reports/product/${productId}`, data);
    }

    createProduct(shopId: string, data: any): Observable<Product> {
        return this.http.post<Product>(`${this.API_URL}/products/${shopId}`, data);
    }

    updateProduct(id: string, data: any): Observable<Product> {
        return this.http.put<Product>(`${this.API_URL}/products/${id}`, data);
    }

    setProductActive(id: string, isActive: boolean): Observable<any> {
        return this.http.patch(`${this.API_URL}/products/${id}/activate`, { isActive });
    }
}
