import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ductpipes } from './ductpipes';

describe('Ductpipes', () => {
  let component: Ductpipes;
  let fixture: ComponentFixture<Ductpipes>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ductpipes],
    }).compileComponents();

    fixture = TestBed.createComponent(Ductpipes);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
