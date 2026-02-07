import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { Category } from '../../shared/models/product.model';

@Injectable({
    providedIn: 'root'
})
export class CategoryService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    getCategories(): Observable<Category[]> {
        return this.http.get<Category[]>(`${this.API_URL}/categories`);
    }
}
