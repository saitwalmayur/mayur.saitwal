import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gearbox1 } from './gearbox1';

describe('Gearbox1', () => {
  let component: Gearbox1;
  let fixture: ComponentFixture<Gearbox1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gearbox1],
    }).compileComponents();

    fixture = TestBed.createComponent(Gearbox1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
