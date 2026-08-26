import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ApplicationCreatorComponent } from './application-creator.component';

describe('ApplicationCreatorComponent', () => {
  let component: ApplicationCreatorComponent;
  let fixture: ComponentFixture<ApplicationCreatorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ApplicationCreatorComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ApplicationCreatorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
