import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';

import { Architect } from '../../models/architect.model';
import { ArchitectInquiry } from '../../models/architect-inquiry.model';
import { ArchitectService } from '../../services/architect.service';
import { ArchitectInquiryService } from '../../services/architect-inquery.service';
import { AuthService } from '../../services/auth.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-user-add-inquiry',
  templateUrl: './user-add-inquiry.component.html',
  styleUrls: ['./user-add-inquiry.component.css']
})
export class UserAddInquiryComponent implements OnInit {
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
  message = '';
  priority = 'Medium';
  contactDetails = '';

  priorityOptions = ['Low', 'Medium', 'High'];

  constructor(
    private architectService: ArchitectService,
    private inquiryService: ArchitectInquiryService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.architectId = Number(this.route.snapshot.queryParamMap.get('architectId'));

    if (!this.architectId) {
      this.router.navigate(['/user/architects']);
      return;
    }

    this.loadArchitect();
  }

  loadArchitect(): void {
    this.isLoading = true;

    this.architectService.getAllArchitects().subscribe({
      next: (architects) => {
        this.isLoading = false;
        const found = (architects || []).find(a => a.architectId === this.architectId);

        if (!found) {
          this.errorMessage = 'Architect not found';
        } else if (found.status === 'Inactive') {
          this.errorMessage = `${found.name} is not taking new inquiries right now.`;
        } else {
          this.architect = found;
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

    if (!userId || !this.architect) {
      this.showAlert('error', 'Failed', 'Please choose an architect from the list and try again.');
      return;
    }

    this.isSaving = true;

    const inquiry: ArchitectInquiry = {
      user: { userId },
      architect: { architectId: this.architectId },
      message: this.message,
      priority: this.priority,
      contactDetails: this.contactDetails,
      status: 'Pending'
    };

    this.inquiryService.addInquiry(inquiry).subscribe({
      next: () => {
        this.isSaving = false;
        this.showAlert('success', 'Inquiry Sent',
          'Your inquiry has been successfully submitted.');
      },

      error: (error) => {
        this.isSaving = false;
        this.showAlert('error', 'Failed',
          describeError(error, 'Failed to submit your inquiry. Please try again.'));
      }
    });
  }

  closeAlert(): void {
    const wasSuccess = this.alert.type === 'success';
    this.alert.show = false;

    if (wasSuccess) {
      this.router.navigate(['/user/inquiries']);
    }
  }

  cancel(): void {
    this.router.navigate(['/user/architects']);
  }
}
