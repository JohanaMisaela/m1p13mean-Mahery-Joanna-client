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
}
