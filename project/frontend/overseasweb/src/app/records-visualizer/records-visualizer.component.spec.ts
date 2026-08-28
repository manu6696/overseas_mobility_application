import { ComponentFixture, TestBed } from '@angular/core/testing';

import { RecordsVisualizerComponent } from './records-visualizer.component';

describe('RecordsVisualizerComponent', () => {
  let component: RecordsVisualizerComponent;
  let fixture: ComponentFixture<RecordsVisualizerComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [RecordsVisualizerComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(RecordsVisualizerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
