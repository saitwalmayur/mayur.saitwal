import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gearboxes } from './gearboxes';

describe('Gearboxes', () => {
  let component: Gearboxes;
  let fixture: ComponentFixture<Gearboxes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gearboxes],
    }).compileComponents();

    fixture = TestBed.createComponent(Gearboxes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
