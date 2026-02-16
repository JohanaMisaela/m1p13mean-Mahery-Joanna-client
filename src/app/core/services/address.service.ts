import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { UserAddress, AddressResponse, CreateAddressDto } from '../../shared/models/address.model';

@Injectable({
    providedIn: 'root'
})
export class AddressService {
    private http = inject(HttpClient);
    private apiUrl = `${environment.apiUrl}/addresses`;

    getUserAddresses(query: any = {}): Observable<AddressResponse> {
        let params = new HttpParams();
        Object.keys(query).forEach(key => {
            if (query[key]) {
                params = params.set(key, query[key]);
            }
        });
        return this.http.get<AddressResponse>(this.apiUrl, { params });
    }

    createAddress(data: CreateAddressDto): Observable<UserAddress> {
        return this.http.post<UserAddress>(this.apiUrl, data);
    }

    setDefaultAddress(addressId: string): Observable<UserAddress> {
        return this.http.put<UserAddress>(`${this.apiUrl}/${addressId}/set-default`, {});
    }

    updateAddress(addressId: string, data: Partial<CreateAddressDto>): Observable<UserAddress> {
        return this.http.put<UserAddress>(`${this.apiUrl}/${addressId}`, data);
    }

    deleteAddress(addressId: string): Observable<void> {
        return this.http.delete<void>(`${this.apiUrl}/${addressId}`);
    }
}
