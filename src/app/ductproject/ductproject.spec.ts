import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Ductproject } from './ductproject';

describe('Ductproject', () => {
  let component: Ductproject;
  let fixture: ComponentFixture<Ductproject>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Ductproject],
    }).compileComponents();

    fixture = TestBed.createComponent(Ductproject);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
