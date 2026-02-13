import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

@Injectable({
    providedIn: 'root'
})
export class ReportService {
    private readonly http = inject(HttpClient);
    private readonly API_URL = environment.apiUrl;

    getShopReports(shopId: string, params: any = {}): Observable<any> {
        let httpParams = new HttpParams();
        Object.keys(params).forEach(key => {
            if (params[key]) httpParams = httpParams.append(key, params[key]);
        });
        return this.http.get(`${this.API_URL}/reports/shop/${shopId}`, { params: httpParams });
    }

    updateReportStatus(reportId: string, status: string): Observable<any> {
        return this.http.put(`${this.API_URL}/reports/${reportId}`, { status });
    }
}
