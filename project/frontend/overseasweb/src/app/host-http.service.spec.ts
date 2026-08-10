import { TestBed } from '@angular/core/testing';

import { HostHttpService } from './host-http.service';

describe('HostHttpService', () => {
  let service: HostHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(HostHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
