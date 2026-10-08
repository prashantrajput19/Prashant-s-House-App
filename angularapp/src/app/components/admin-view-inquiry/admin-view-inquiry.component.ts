import { Component, OnInit } from '@angular/core';

import { ArchitectInquiry } from '../../models/architect-inquiry.model';
import { ArchitectInquiryService } from '../../services/architect-inquery.service';
import { describeError } from '../../error-message';

@Component({
  selector: 'app-admin-view-inquiry',
  templateUrl: './admin-view-inquiry.component.html',
  styleUrls: ['./admin-view-inquiry.component.css']
})
export class AdminViewInquiryComponent implements OnInit {
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
  priorityFilter = '';

  statusOptions = ['Pending', 'In Progress', 'Resolved', 'Closed'];

  inquiryToUpdate?: ArchitectInquiry;
  newStatus = '';
  showStatusModal = false;
  isUpdating = false;

  drafts: { [inquiryId: number]: string } = {};

  constructor(private inquiryService: ArchitectInquiryService) { }

  hasDetail(inquiry: ArchitectInquiry): boolean {
    return inquiry.status !== 'Closed' || !!inquiry.subInquiries?.length;
  }

  sendReply(inquiry: ArchitectInquiry): void {
    const id = inquiry.inquiryId!;
    const message = (this.drafts[id] || '').trim();

    if (!message) {
      return;
    }

    this.inquiryService.addSubInquiry(id, message).subscribe({
      next: (updated) => {
        this.drafts[id] = '';
        this.inquiries = this.inquiries.map(i => i.inquiryId === id ? updated : i);
      },
      error: (error) => this.showAlert('error', 'Failed',
        describeError(error, 'Failed to send your reply.'))
    });
  }

  ngOnInit(): void {
    this.loadInquiries();
  }

  loadInquiries(): void {
    this.errorMessage = '';
    this.isLoading = true;

    this.inquiryService.getAllInquiries().subscribe({
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

        this.errorMessage = describeError(error, 'Unable to retrieve inquiries');
      }
    });
  }

  get priorityOptions(): string[] {
    return Array.from(
      new Set(this.inquiries.map(i => i.priority).filter((p): p is string => !!p))
    ).sort();
  }

  get hasFilters(): boolean {
    return !!(this.search || this.statusFilter || this.priorityFilter);
  }

  get filteredInquiries(): ArchitectInquiry[] {
    const search = this.search.trim().toLowerCase();

    return this.inquiries.filter(inquiry =>
      (!search ||
        String(inquiry.message ?? '').toLowerCase().includes(search) ||
        String(inquiry.architect?.name ?? '').toLowerCase().includes(search) ||
        String(inquiry.user?.username ?? '').toLowerCase().includes(search)) &&
      (!this.statusFilter || inquiry.status === this.statusFilter) &&
      (!this.priorityFilter || inquiry.priority === this.priorityFilter)
    );
  }

  clearFilters(): void {
    this.search = '';
    this.statusFilter = '';
    this.priorityFilter = '';
  }

  openStatusModal(inquiry: ArchitectInquiry): void {
    this.inquiryToUpdate = inquiry;
    this.newStatus = inquiry.status ?? 'Pending';
    this.showStatusModal = true;
  }

  closeStatusModal(): void {
    this.showStatusModal = false;
    this.inquiryToUpdate = undefined;
  }

  confirmStatusUpdate(): void {
    const inquiry = this.inquiryToUpdate;

    if (!inquiry || inquiry.inquiryId === undefined) {
      return;
    }

    this.isUpdating = true;

    const payload: ArchitectInquiry = {
      ...inquiry,
      status: this.newStatus
    };

    this.inquiryService.updateInquiry(inquiry.inquiryId, payload).subscribe({
      next: () => {
        this.isUpdating = false;
        this.closeStatusModal();
        this.showAlert('success', 'Updated', 'Inquiry status updated successfully!');
        this.loadInquiries();
      },

      error: (error) => {
        this.isUpdating = false;
        this.closeStatusModal();
        this.showAlert('error', 'Update Failed',
          describeError(error, 'Failed to update the inquiry!'));
      }
    });
  }

  handleModalKeydown(event: KeyboardEvent): void {
    if (event.key === 'Escape') {
      if (!this.isUpdating) {
        this.closeStatusModal();
      }
      this.closeAlert();
    }
  }

  badgeClass(value: string | undefined): string {
    return String(value ?? '').toLowerCase().replace(/\s+/g, '');
  }
}
