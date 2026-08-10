import { TestBed } from '@angular/core/testing';

import { TranscriptRecordHttpService } from './transcript-record-http.service';

describe('TranscriptRecordHttpService', () => {
  let service: TranscriptRecordHttpService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(TranscriptRecordHttpService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
