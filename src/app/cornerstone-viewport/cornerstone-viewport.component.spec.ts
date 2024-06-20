import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CornerstoneViewportComponent } from './cornerstone-viewport.component';

describe('CornerstoneViewportComponent', () => {
  let component: CornerstoneViewportComponent;
  let fixture: ComponentFixture<CornerstoneViewportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CornerstoneViewportComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CornerstoneViewportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
