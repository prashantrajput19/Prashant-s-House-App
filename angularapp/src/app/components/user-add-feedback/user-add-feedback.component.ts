import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Architect } from '../../models/architect.model';
import { Feedback } from '../../models/feedback.model';
import { ArchitectService } from '../../services/architect.service';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-user-add-feedback',
  templateUrl: './user-add-feedback.component.html',
  styleUrls: ['./user-add-feedback.component.css']
})
export class UserAddFeedbackComponent implements OnInit {
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

  handleModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      this.closeAlert();
    }
  }

  architect?: Architect;
  isLoading = false;
  isSaving = false;

  architectId = 0;
  feedbackText = '';
  category = 'Service';
  date = new Date().toISOString().substring(0, 10);

  categoryOptions = ['Service', 'Design', 'Communication', 'Pricing', 'Timeliness'];

  rating = 0;
  hoverRating = 0;
  ratingLabels = ['', 'Poor', 'Fair', 'Good', 'Very good', 'Excellent'];

  get shownRating(): number {
    return this.hoverRating || this.rating;
  }

  constructor(
    private architectService: ArchitectService,
    private feedbackService: FeedbackService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.architectId = Number(this.route.snapshot.queryParamMap.get('architectId'));

    if (!this.architectId) {
      this.router.navigate(['/user/inquiries']);
      return;
    }

    this.loadArchitect();
  }

  loadArchitect(): void {
    this.isLoading = true;

    this.architectService.getAllArchitects().subscribe({
      next: (architects) => {
        this.isLoading = false;
        this.architect = (architects || []).find(a => a.architectId === this.architectId);

        if (!this.architect) {
          this.errorMessage = 'Architect not found';
        }
      },

      error: (error) => {
        this.isLoading = false;
        this.errorMessage = describeError(error, 'Unable to load architects');
      }
    });
  }

  save(): void {
    const userId = this.authService.getUserId();

    if (!userId) {
      this.showAlert('error', 'Failed', 'Please login again to submit feedback.');
      return;
    }

    this.isSaving = true;

    const feedback: Feedback = {
      feedbackText: this.feedbackText,
      date: this.date,
      category: this.category,
      rating: this.rating,
      user: { userId },
      architect: { architectId: this.architectId }
    };

    this.feedbackService.sendFeedback(feedback).subscribe({
      next: () => {
        this.isSaving = false;
        this.showAlert('success', 'Thank you', 'Feedback submitted successfully!');
      },

      error: (error) => {
        this.isSaving = false;
        this.showAlert('error', 'Failed',
          describeError(error, 'Failed to submit feedback. Please try again.'));
      }
    });
  }

  closeAlert(): void {
    const wasSuccess = this.alert.type === 'success';
    this.alert.show = false;

    if (wasSuccess) {
      this.router.navigate(['/user/feedback']);
    }
  }

  cancel(): void {
    this.router.navigate(['/user/feedback']);
  }
}
