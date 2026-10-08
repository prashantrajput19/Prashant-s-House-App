import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { Architect } from '../../models/architect.model';
import { ArchitectService } from '../../services/architect.service';
import { FeedbackService } from '../../services/feedback.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-admin-view-architect',
  templateUrl: './admin-view-architect.component.html',
  styleUrls: ['./admin-view-architect.component.css']
})
export class AdminViewArchitectComponent implements OnInit {
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

  architects: Architect[] = [];
  isLoading = false;

  search = '';
  expertiseFilter = '';
  statusFilter = '';

  architectToDelete?: Architect;
  showDeleteModal = false;
  isDeleting = false;

  userRatings: { [architectId: number]: { average: number; count: number } } = {};

  sortBy = '';

  constructor(
    private architectService: ArchitectService,
    private feedbackService: FeedbackService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadArchitects();
    this.loadUserRatings();
  }

  loadUserRatings(): void {
    this.feedbackService.getFeedbacks().subscribe(feedbacks => {
      const totals: { [architectId: number]: { sum: number; count: number } } = {};

      for (const feedback of feedbacks || []) {
        const id = feedback.architect?.architectId;
        if (!id || !feedback.rating) {
          continue;
        }
        totals[id] = totals[id] || { sum: 0, count: 0 };
        totals[id].sum += feedback.rating;
        totals[id].count++;
      }

      this.userRatings = {};
      for (const id of Object.keys(totals).map(Number)) {
        this.userRatings[id] = { average: totals[id].sum / totals[id].count, count: totals[id].count };
      }
    });
  }

  private userAverage(architect: Architect): number {
    return this.userRatings[architect.architectId ?? 0]?.average ?? 0;
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

  get statusOptions(): string[] {
    return this.unique(this.architects.map(a => a.status));
  }

  get hasFilters(): boolean {
    return !!(this.search || this.expertiseFilter || this.statusFilter || this.sortBy);
  }

  get filteredArchitects(): Architect[] {
    const search = this.search.trim().toLowerCase();

    const list = this.architects.filter(architect =>
      (!search ||
        String(architect.name ?? '').toLowerCase().includes(search) ||
        String(architect.location ?? '').toLowerCase().includes(search)) &&
      (!this.expertiseFilter || architect.expertise === this.expertiseFilter) &&
      (!this.statusFilter || architect.status === this.statusFilter)
    );

    const isActive = (a: Architect) => (a.status === 'Active' ? 1 : 0);
    const sorters: { [key: string]: (a: Architect, b: Architect) => number } = {
      userHigh: (a, b) => this.userAverage(b) - this.userAverage(a),
      userLow: (a, b) => this.userAverage(a) - this.userAverage(b),
      ratingHigh: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
      ratingLow: (a, b) => (a.rating ?? 0) - (b.rating ?? 0),
      activeFirst: (a, b) => isActive(b) - isActive(a),
      inactiveFirst: (a, b) => isActive(a) - isActive(b)
    };

    return this.sortBy ? list.sort(sorters[this.sortBy]) : list;
  }

  clearFilters(): void {
    this.search = '';
    this.expertiseFilter = '';
    this.statusFilter = '';
    this.sortBy = '';
  }

  editArchitect(architectId: number | undefined): void {
    if (architectId === undefined) {
      this.showAlert('error', 'Failed', 'Architect ID is not available');
      return;
    }

    this.router.navigate(['/admin/architects/edit', architectId]);
  }

  deleteArchitect(architectId: number | undefined): void {
    if (architectId === undefined) {
      this.showAlert('error', 'Delete Failed', 'Architect ID is not available');
      return;
    }

    this.architectToDelete = this.architects.find(a => a.architectId === architectId);
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const architectId = this.architectToDelete?.architectId;

    if (architectId === undefined) {
      return;
    }

    this.isDeleting = true;

    this.architectService.deleteArchitect(architectId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showAlert('success', 'Deleted', 'Architect deleted successfully!');
        this.loadArchitects();
      },

      error: (error) => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showAlert('error', 'Delete Failed',
          describeError(error, 'Failed to delete Architect!'));
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.architectToDelete = undefined;
  }

  handleModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.isDeleting) {
        this.closeDeleteModal();
      }
      this.closeAlert();
    }
  }

  statusClass(status: string | undefined): string {
    return String(status ?? '').toLowerCase().replace(/\s+/g, '');
  }

  private unique(values: (string | undefined)[]): string[] {
    return Array.from(new Set(values.filter((v): v is string => !!v))).sort();
  }
}
