import { Component, OnInit } from '@angular/core';

import { Architect } from '../../models/architect.model';
import { ArchitectInquiry } from '../../models/architect-inquiry.model';
import { Feedback } from '../../models/feedback.model';
import { ArchitectService } from '../../services/architect.service';
import { ArchitectInquiryService } from '../../services/architect-inquery.service';
import { FeedbackService } from '../../services/feedback.service';
import { AuthService } from '../../services/auth.service';
import { ChartBar } from '../bar-chart/bar-chart.component';

interface Slice {
  label: string;
  value: number;
  color: string;
}

@Component({
  selector: 'app-admin-control-panel',
  templateUrl: './admin-control-panel.component.html',
  styleUrls: ['./admin-control-panel.component.css']
})
export class AdminControlPanelComponent implements OnInit {
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
  inquiries: ArchitectInquiry[] = [];
  feedbacks: Feedback[] = [];

  isLoading = false;

  readonly inquiryStatus: Slice[] = [
    { label: 'Pending', value: 18, color: '#f2b544' },
    { label: 'In Progress', value: 12, color: '#6ea8ff' },
    { label: 'Resolved', value: 26, color: '#34d399' },
    { label: 'Closed', value: 9, color: '#8b93a1' }
  ];

  readonly expertiseShare: Slice[] = [
    { label: 'Residential', value: 32, color: '#f2b544' },
    { label: 'Commercial', value: 21, color: '#6ea8ff' },
    { label: 'Interior Design', value: 17, color: '#e0724f' },
    { label: 'Landscape', value: 12, color: '#34d399' },
    { label: 'Urban Planning', value: 9, color: '#b56fd1' },
    { label: 'Sustainable Design', value: 9, color: '#2fa39a' }
  ];

  readonly months = ['Nov', 'Dec', 'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct'];
  readonly monthlyInquiries = [14, 18, 16, 22, 27, 25, 31, 36, 33, 41, 46, 52];

  readonly satisfaction = 86;

  readonly ratingBars: ChartBar[] = [
    { label: '1★', value: 3 },
    { label: '2★', value: 5 },
    { label: '3★', value: 14 },
    { label: '4★', value: 38 },
    { label: '5★', value: 52 }
  ];

  readonly donutCircumference = 2 * Math.PI * 70;
  readonly donutSegments = this.segments(this.inquiryStatus, this.donutCircumference);
  readonly pieSlices = this.pieArcs(this.expertiseShare);

  readonly linePoints = this.monthlyInquiries.map((value, i) => ({
    x: 30 + i * (540 / (this.monthlyInquiries.length - 1)),
    y: 190 - (value / Math.max(...this.monthlyInquiries)) * 160,
    value
  }));
  readonly linePath = this.linePoints.map(p => `${p.x},${p.y}`).join(' ');
  readonly areaPath = `M30,190 L${this.linePath} L570,190 Z`;

  constructor(
    private architectService: ArchitectService,
    private inquiryService: ArchitectInquiryService,
    private feedbackService: FeedbackService,
    private authService: AuthService
  ) { }

  ngOnInit(): void {
    this.isLoading = true;

    this.architectService.getAllArchitects().subscribe({
      next: (architects) => {
        this.architects = architects || [];
        this.isLoading = false;
      },
      error: () => {
        this.architects = [];
        this.isLoading = false;
      }
    });

    this.inquiryService.getAllInquiries().subscribe({
      next: (inquiries) => { this.inquiries = inquiries || []; },
      error: () => { this.inquiries = []; }
    });

    this.feedbackService.getFeedbacks().subscribe({
      next: (feedbacks) => { this.feedbacks = feedbacks || []; },
      error: () => { this.feedbacks = []; }
    });
  }

  get username(): string {
    return this.authService.getUserName();
  }

  get activeArchitects(): number {
    return this.architects.filter(a => a.status === 'Active').length;
  }

  get pendingInquiries(): number {
    return this.inquiries.filter(i => !i.status || i.status === 'Pending').length;
  }

  get inquiryTotal(): number {
    return this.inquiryStatus.reduce((sum, slice) => sum + slice.value, 0);
  }

  private pieArcs(slices: Slice[]): { slice: Slice; path: string }[] {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    const point = (angle: number) => `${100 + 90 * Math.sin(angle)},${100 - 90 * Math.cos(angle)}`;
    let angle = 0;
    return slices.map(slice => {
      const sweep = (slice.value / total) * 2 * Math.PI;
      const path = `M100,100 L${point(angle)} A90,90 0 ${sweep > Math.PI ? 1 : 0} 1 ${point(angle + sweep)} Z`;
      angle += sweep;
      return { slice, path };
    });
  }

  private segments(slices: Slice[], circumference: number): { slice: Slice; dash: string; offset: number }[] {
    const total = slices.reduce((sum, slice) => sum + slice.value, 0);
    let start = 0;
    return slices.map(slice => {
      const length = (slice.value / total) * circumference;
      const segment = { slice, dash: `${length} ${circumference - length}`, offset: -start };
      start += length;
      return segment;
    });
  }

  get averageRating(): string {
    if (this.architects.length === 0) {
      return '—';
    }

    const total = this.architects.reduce((sum, a) => sum + (Number(a.rating) || 0), 0);
    return (total / this.architects.length).toFixed(1);
  }
}
