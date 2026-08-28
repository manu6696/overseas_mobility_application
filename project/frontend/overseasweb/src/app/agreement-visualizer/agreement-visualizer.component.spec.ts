import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AgreementVisualizerComponent } from './agreement-visualizer.component';

describe('AgreementVisualizerComponent', () => {
  let component: AgreementVisualizerComponent;
  let fixture: ComponentFixture<AgreementVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AgreementVisualizerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(AgreementVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
