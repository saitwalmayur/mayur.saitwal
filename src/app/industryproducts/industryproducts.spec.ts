import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Industryproducts } from './industryproducts';

describe('Industryproducts', () => {
  let component: Industryproducts;
  let fixture: ComponentFixture<Industryproducts>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Industryproducts],
    }).compileComponents();

    fixture = TestBed.createComponent(Industryproducts);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
