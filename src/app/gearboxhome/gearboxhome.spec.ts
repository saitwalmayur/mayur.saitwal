import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Gearboxhome } from './gearboxhome';

describe('Gearboxhome', () => {
  let component: Gearboxhome;
  let fixture: ComponentFixture<Gearboxhome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Gearboxhome],
    }).compileComponents();

    fixture = TestBed.createComponent(Gearboxhome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
