import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Fluidsexample1 } from './fluidsexample1';

describe('Fluidsexample1', () => {
  let component: Fluidsexample1;
  let fixture: ComponentFixture<Fluidsexample1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Fluidsexample1],
    }).compileComponents();

    fixture = TestBed.createComponent(Fluidsexample1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
