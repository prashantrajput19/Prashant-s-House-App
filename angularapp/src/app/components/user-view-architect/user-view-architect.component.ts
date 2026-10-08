import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Architect } from '../../models/architect.model';
import { ArchitectService } from '../../services/architect.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-user-view-architect',
  templateUrl: './user-view-architect.component.html',
  styleUrls: ['./user-view-architect.component.css']
})
export class UserViewArchitectComponent implements OnInit {
  alert = {
    show: false,
    type: 'success' as 'success' | 'error',
    title: '',
    message: ''
  };

  errorMessage = '';

  showAlert(type: 'success' | 'error', title: string, message: string): void {
    this.alert = { show: true, type, title, message };
  }

  closeAlert(): void {
    this.alert.show = false;
  }

  handleModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAlert();
    }
  }

  architects: Architect[] = [];
  isLoading = false;

  search = '';
  expertiseFilter = '';
  locationFilter = '';

  constructor(private architectService: ArchitectService, private router: Router) { }

  ngOnInit(): void {
    this.loadArchitects();
  }

  loadArchitects(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.architectService.getAllArchitects().subscribe({
      next: (architects) => {
        this.isLoading = false;
        this.architects = architects || [];
      },

      error: (error) => {
        this.isLoading = false;

        if (error.status === 204) {
          this.architects = [];
          return;
        }

        this.errorMessage = describeError(error, 'Unable to retrieve architects');
      }
    });
  }

  get expertiseOptions(): string[] {
    return this.unique(this.architects.map(a => a.expertise));
  }

  get locationOptions(): string[] {
    return this.unique(this.architects.map(a => a.location));
  }

  get hasFilters(): boolean {
    return !!(this.search || this.expertiseFilter || this.locationFilter);
  }

  get filteredArchitects(): Architect[] {
    const search = this.search.trim().toLowerCase();

    return this.architects.filter(architect =>
      (!search ||
        String(architect.name ?? '').toLowerCase().includes(search) ||
        String(architect.expertise ?? '').toLowerCase().includes(search)) &&
      (!this.expertiseFilter || architect.expertise === this.expertiseFilter) &&
      (!this.locationFilter || architect.location === this.locationFilter)
    );
  }

  clearFilters(): void {
    this.search = '';
    this.expertiseFilter = '';
    this.locationFilter = '';
  }

  sendInquiry(architectId: number | undefined): void {
    if (architectId === undefined) {
      this.showAlert('error', 'Failed', 'Architect ID is not available');
      return;
    }

    this.router.navigate(['/user/inquiry'], { queryParams: { architectId } });
  }

  statusClass(status: string | undefined): string {
    return String(status ?? '').toLowerCase().replace(/\s+/g, '');
  }

  private unique(values: (string | undefined)[]): string[] {
    return Array.from(new Set(values.filter((v): v is string => !!v))).sort();
  }
}
