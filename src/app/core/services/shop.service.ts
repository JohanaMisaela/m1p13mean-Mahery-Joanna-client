import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Shop } from '../../shared/models/product.model';

@Injectable({
    providedIn: 'root'
})
export class ShopService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    getShops(): Observable<any> {
        return this.http.get<any>(`${this.API_URL}/shop`);
    }

    getShopById(id: string): Observable<Shop> {
        return this.http.get<Shop>(`${this.API_URL}/shop/${id}`);
    }
}
