import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Environment1 } from './environment1';

describe('Environment1', () => {
  let component: Environment1;
  let fixture: ComponentFixture<Environment1>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Environment1],
    }).compileComponents();

    fixture = TestBed.createComponent(Environment1);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
