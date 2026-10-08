import { Component, OnInit } from '@angular/core';
import { Router } from '@angular/router';

import { ArchitectInquiry } from '../../models/architect-inquiry.model';
import { ArchitectInquiryService } from '../../services/architect-inquery.service';
import { AuthService } from '../../services/auth.service';
import { FeedbackService } from '../../services/feedback.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-user-view-inquiries',
  templateUrl: './user-view-inquiries.component.html',
  styleUrls: ['./user-view-inquiries.component.css']
})
export class UserViewInquiriesComponent implements OnInit {
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

  inquiries: ArchitectInquiry[] = [];
  isLoading = false;

  search = '';
  statusFilter = '';

  inquiryToDelete?: ArchitectInquiry;
  showDeleteModal = false;
  isDeleting = false;

  drafts: { [inquiryId: number]: string } = {};

  myRatings: { [architectId: number]: number } = {};

  constructor(
    private inquiryService: ArchitectInquiryService,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.loadInquiries();
    this.loadMyRatings();
  }

  loadMyRatings(): void {
    const userId = this.authService.getUserId();
    if (!userId) {
      return;
    }

    this.feedbackService.getAllFeedbacksByUserId(userId).subscribe(feedbacks => {
      for (const feedback of feedbacks || []) {
        if (feedback.architect?.architectId && feedback.rating) {
          this.myRatings[feedback.architect.architectId] = feedback.rating;
        }
      }
    });
  }

  ratingFor(inquiry: ArchitectInquiry): number {
    return this.myRatings[inquiry.architect?.architectId ?? 0] || 0;
  }

  giveFeedback(inquiry: ArchitectInquiry): void {
    this.router.navigate(['/user/feedback/add'], { queryParams: { architectId: inquiry.architect?.architectId } });
  }

  loadInquiries(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.errorMessage = 'Please login again to see your inquiries';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.inquiryService.getInquiriesByUserId(userId).subscribe({
      next: (inquiries) => {
        this.isLoading = false;
        this.inquiries = inquiries || [];
      },

      error: (error) => {
        this.isLoading = false;

        if (error.status === 204) {
          this.inquiries = [];
          return;
        }

        this.errorMessage = describeError(error, 'Unable to retrieve your inquiries');
      }
    });
  }

  get statusOptions(): string[] {
    return Array.from(
      new Set(this.inquiries.map(i => i.status).filter((s): s is string => !!s))
    ).sort();
  }

  get hasFilters(): boolean {
    return !!(this.search || this.statusFilter);
  }

  get filteredInquiries(): ArchitectInquiry[] {
    const search = this.search.trim().toLowerCase();

    return this.inquiries.filter(inquiry =>
      (!search ||
        String(inquiry.message ?? '').toLowerCase().includes(search) ||
        String(inquiry.architect?.name ?? '').toLowerCase().includes(search)) &&
      (!this.statusFilter || inquiry.status === this.statusFilter)
    );
  }

  clearFilters(): void {
    this.search = '';
    this.statusFilter = '';
  }

  deleteInquiry(inquiry: ArchitectInquiry): void {
    this.inquiryToDelete = inquiry;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const inquiryId = this.inquiryToDelete?.inquiryId;

    if (inquiryId === undefined) {
      return;
    }

    this.isDeleting = true;

    this.inquiryService.deleteInquiry(inquiryId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showAlert('success', 'Deleted', 'Your inquiry was withdrawn successfully.');
        this.loadInquiries();
      },

      error: (error) => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showAlert('error', 'Delete Failed',
          describeError(error, 'Failed to withdraw this inquiry.'));
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.inquiryToDelete = undefined;
  }

  handleModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.isDeleting) {
        this.closeDeleteModal();
      }
      this.closeAlert();
    }
  }

  sendSubInquiry(inquiry: ArchitectInquiry): void {
    const id = inquiry.inquiryId!;
    const message = (this.drafts[id] || '').trim();

    if (!message) {
      return;
    }

    this.inquiryService.addSubInquiry(id, message).subscribe({
      next: (updated) => {
        this.drafts[id] = '';
        this.replaceInquiry(updated);
      },
      error: (error) => this.showAlert('error', 'Failed',
        describeError(error, 'Failed to send your follow-up.'))
    });
  }

  private replaceInquiry(updated: ArchitectInquiry): void {
    this.inquiries = this.inquiries.map(i => i.inquiryId === updated.inquiryId ? updated : i);
  }

  badgeClass(value: string | undefined): string {
    return String(value ?? '').toLowerCase().replace(/\s+/g, '');
  }
}
