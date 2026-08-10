import { TestBed } from '@angular/core/testing';

import { AgreementHttpService } from './agreement-http.service';

describe('AgreementHttpService', () => {
  let service: AgreementHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(AgreementHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
