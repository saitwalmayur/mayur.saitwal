import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Findmyspotunity } from './findmyspotunity';

describe('Findmyspotunity', () => {
  let component: Findmyspotunity;
  let fixture: ComponentFixture<Findmyspotunity>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Findmyspotunity],
    }).compileComponents();

    fixture = TestBed.createComponent(Findmyspotunity);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
