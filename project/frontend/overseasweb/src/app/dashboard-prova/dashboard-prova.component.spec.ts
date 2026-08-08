import { waitForAsync, ComponentFixture, TestBed } from '@angular/core/testing';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';

import { DashboardProvaComponent } from './dashboard-prova.component';

describe('DashboardProvaComponent', () => {
  let component: DashboardProvaComponent;
  let fixture: ComponentFixture<DashboardProvaComponent>;

  beforeEach(waitForAsync(() => {
    TestBed.configureTestingModule({
      declarations: [DashboardProvaComponent],
      imports: [
        MatButtonModule,
        MatCardModule,
        MatGridListModule,
        MatIconModule,
        MatMenuModule,
      ]
    });
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DashboardProvaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should compile', () => {
    expect(component).toBeTruthy();
  });
});
