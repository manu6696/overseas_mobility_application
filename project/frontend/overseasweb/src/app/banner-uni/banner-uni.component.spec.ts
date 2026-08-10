import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BannerUniComponent } from './banner-uni.component';

describe('BannerUniComponent', () => {
  let component: BannerUniComponent;
  let fixture: ComponentFixture<BannerUniComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BannerUniComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BannerUniComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
