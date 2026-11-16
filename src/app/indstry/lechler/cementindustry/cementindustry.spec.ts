import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Cementindustry } from './cementindustry';

describe('Cementindustry', () => {
  let component: Cementindustry;
  let fixture: ComponentFixture<Cementindustry>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Cementindustry],
    }).compileComponents();

    fixture = TestBed.createComponent(Cementindustry);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
