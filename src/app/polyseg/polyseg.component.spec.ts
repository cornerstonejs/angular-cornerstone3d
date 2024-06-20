import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PolysegComponent } from './polyseg.component';

describe('PolysegComponent', () => {
  let component: PolysegComponent;
  let fixture: ComponentFixture<PolysegComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PolysegComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PolysegComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
