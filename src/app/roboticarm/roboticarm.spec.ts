import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Roboticarm } from './roboticarm';

describe('Roboticarm', () => {
  let component: Roboticarm;
  let fixture: ComponentFixture<Roboticarm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Roboticarm],
    }).compileComponents();

    fixture = TestBed.createComponent(Roboticarm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
