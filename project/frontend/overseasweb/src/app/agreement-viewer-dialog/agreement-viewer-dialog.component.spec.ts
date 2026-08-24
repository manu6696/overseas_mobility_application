import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementViewerDialogComponent } from './agreement-viewer-dialog.component';

describe('AgreementViewerDialogComponent', () => {
  let component: AgreementViewerDialogComponent;
  let fixture: ComponentFixture<AgreementViewerDialogComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgreementViewerDialogComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgreementViewerDialogComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
