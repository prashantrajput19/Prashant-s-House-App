import { TestBed } from '@angular/core/testing';
import { HttpClientTestingModule } from '@angular/common/http/testing';

import { ArchitectService } from './architect.service';

describe('ArchitectService', () => {
  let service: ArchitectService;

  beforeEach(() => {
    TestBed.configureTestingModule({
      imports: [HttpClientTestingModule],
    });
    service = TestBed.inject(ArchitectService);
  });

  fit('frontend_should_create_architect_service', () => {
    expect((service as any)).toBeTruthy();
  });
});
