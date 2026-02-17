import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Order, OrderResponse } from '../../shared/models/order.model';

@Injectable({
    providedIn: 'root'
})
export class OrderService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/orders`;

    getShopOrders(shopId: string, query: any = {}): Observable<OrderResponse> {
        let params = new HttpParams();
        params = params.set('shopId', shopId);

        Object.keys(query).forEach(key => {
            const value = query[key];
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value.toString());
            }
        });

        return this.http.get<OrderResponse>(`${this.apiUrl}/shop`, { params });
    }

    getMyOrders(query: any = {}): Observable<OrderResponse> {
        let params = new HttpParams();

        Object.keys(query).forEach(key => {
            const value = query[key];
            if (value !== undefined && value !== null && value !== '') {
                params = params.set(key, value.toString());
            }
        });

        return this.http.get<OrderResponse>(`${this.apiUrl}/my`, { params });
    }

    updateOrderStatus(orderId: string, status: string): Observable<Order> {
        return this.http.put<Order>(`${this.apiUrl}/${orderId}/status`, { status });
    }

    createOrder(orderData: any): Observable<Order> {
        return this.http.post<Order>(this.apiUrl, orderData);
    }
}
