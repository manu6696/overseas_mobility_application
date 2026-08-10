import { TestBed } from '@angular/core/testing';

import { ApplicationHttpService } from './application-http.service';

describe('ApplicationHttpService', () => {
  let service: ApplicationHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(ApplicationHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
