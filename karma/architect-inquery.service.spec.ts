import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ArchitectInquiryService } from './architect-inquery.service';

describe('ArchitectInquiryService', () => {
  let service: ArchitectInquiryService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ArchitectInquiryService);
  });

  fit('frontend_should_create_architect_inquiry_service', () => {
    expect((service as any)).toBeTruthy();
  });
});
