import { Component, OnInit } from '@angular/core';

import { Feedback } from '../../models/feedback.model';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-user-view-feedback',
  templateUrl: './user-view-feedback.component.html',
  styleUrls: ['./user-view-feedback.component.css']
})
export class UserViewFeedbackComponent implements OnInit {
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

  feedbacks: Feedback[] = [];
  isLoading = false;

  search = '';
  categoryFilter = '';

  feedbackToDelete?: Feedback;
  showDeleteModal = false;
  isDeleting = false;

  constructor(
    private feedbackService: FeedbackService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.loadFeedbacks();
  }

  loadFeedbacks(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.errorMessage = 'Please login again to see your feedback';
      return;
    }

    this.errorMessage = '';
    this.isLoading = true;

    this.feedbackService.getAllFeedbacksByUserId(userId).subscribe({
      next: (feedbacks) => {
        this.isLoading = false;
        this.feedbacks = feedbacks || [];
      },

      error: (error) => {
        this.isLoading = false;

        if (error.status === 204) {
          this.feedbacks = [];
          return;
        }

        this.errorMessage = describeError(error, 'Unable to retrieve your feedback');
      }
    });
  }

  get categoryOptions(): string[] {
    return Array.from(
      new Set(this.feedbacks.map(f => f.category).filter((c): c is string => !!c))
    ).sort();
  }

  get hasFilters(): boolean {
    return !!(this.search || this.categoryFilter);
  }

  get filteredFeedbacks(): Feedback[] {
    const search = this.search.trim().toLowerCase();

    return this.feedbacks.filter(feedback =>
      (!search ||
        String(feedback.feedbackText ?? '').toLowerCase().includes(search) ||
        this.architectName(feedback).toLowerCase().includes(search)) &&
      (!this.categoryFilter || feedback.category === this.categoryFilter)
    );
  }

  clearFilters(): void {
    this.search = '';
    this.categoryFilter = '';
  }

  architectName(feedback: Feedback): string {
    return (feedback.architect as any)?.name ?? '';
  }

  deleteFeedback(feedback: Feedback): void {
    this.feedbackToDelete = feedback;
    this.showDeleteModal = true;
  }

  confirmDelete(): void {
    const feedbackId = this.feedbackToDelete?.feedbackId;

    if (feedbackId === undefined) {
      return;
    }

    this.isDeleting = true;

    this.feedbackService.deleteFeedback(feedbackId).subscribe({
      next: () => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showAlert('success', 'Deleted', 'Your feedback was deleted successfully.');
        this.loadFeedbacks();
      },

      error: (error) => {
        this.isDeleting = false;
        this.closeDeleteModal();
        this.showAlert('error', 'Delete Failed',
          describeError(error, 'Failed to delete this feedback.'));
      }
    });
  }

  closeDeleteModal(): void {
    this.showDeleteModal = false;
    this.feedbackToDelete = undefined;
  }

  handleModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.isDeleting) {
        this.closeDeleteModal();
      }
      this.closeAlert();
    }
  }
}
