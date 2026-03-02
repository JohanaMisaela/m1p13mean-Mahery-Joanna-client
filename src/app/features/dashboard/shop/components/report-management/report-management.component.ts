import { Component, Input, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ReportService } from '../../../../../core/services/report.service';
import { PaginationComponent } from '../../../../../shared/components/pagination/pagination.component';
import {
  AppSelectComponent,
  SelectOption,
} from '../../../../../shared/components/app-select/app-select.component';
@Component({
  selector: 'app-report-management',
  standalone: true,
  imports: [CommonModule, FormsModule, PaginationComponent, AppSelectComponent],
  templateUrl: './report-management.component.html',
})
export class ReportManagementComponent implements OnInit {
  private reportService = inject(ReportService);

  @Input() shopId!: string;

  reports = signal<any[]>([]);
  total = signal<number>(0);
  loading = signal<boolean>(false);
  openDropdownId = signal<string | null>(null);

  // Filters
  selectedStatus = signal<string>('');
  selectedType = signal<string>('');
  page = signal<number>(1);
  limit = signal<number>(50);

  statusOptions: SelectOption[] = [
    { label: 'Tous les statuts', value: '' },
    { label: 'En attente', value: 'pending' },
    { label: 'Résolu', value: 'resolved' },
    { label: 'Rejeté', value: 'dismissed' },
  ];

  typeOptions: SelectOption[] = [
    { label: 'Tous les types', value: '' },
    { label: 'Produits', value: 'product' },
    { label: 'Boutique', value: 'shop' },
  ];

  actionOptions: SelectOption[] = [
    { label: 'En attente', value: 'pending' },
    { label: 'Résolu', value: 'resolved' },
    { label: 'Rejeté', value: 'dismissed' },
  ];

  ngOnInit() {
    if (this.shopId) {
      this.loadReports();
    }
  }

  loadReports() {
    this.loading.set(true);
    const params: any = {
      page: this.page(),
      limit: this.limit(),
    };

    if (this.selectedStatus()) params.status = this.selectedStatus();
    if (this.selectedType()) params.targetType = this.selectedType();

    this.reportService.getShopReports(this.shopId, params).subscribe({
      next: (res: any) => {
        this.reports.set(res.data);
        this.total.set(res.total);
        this.loading.set(false);
      },
      error: () => this.loading.set(false),
    });
  }

  updateStatus(report: any, newStatus: string) {
    if (!newStatus || report.status === newStatus) return;

    this.reportService.updateReportStatus(report._id, newStatus).subscribe(() => {
      // Optimistic update
      this.reports.update((items) =>
        items.map((item) => (item._id === report._id ? { ...item, status: newStatus } : item)),
      );
    });
  }

  toggleDropdown(reportId: string, event: Event) {
    event.stopPropagation();
    if (this.openDropdownId() === reportId) {
      this.openDropdownId.set(null);
    } else {
      this.openDropdownId.set(reportId);
    }
  }

  onFilterChange() {
    this.page.set(1);
    this.loadReports();
  }

  getPageCount(): number {
    return Math.ceil(this.total() / this.limit());
  }

  prevPage() {
    if (this.page() > 1) {
      this.page.update((p) => p - 1);
      this.loadReports();
    }
  }

  nextPage() {
    if (this.page() < this.getPageCount()) {
      this.page.update((p) => p + 1);
      this.loadReports();
    }
  }
}
