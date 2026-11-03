import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Thirdpersoncharacter } from './thirdpersoncharacter';

describe('Thirdpersoncharacter', () => {
  let component: Thirdpersoncharacter;
  let fixture: ComponentFixture<Thirdpersoncharacter>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Thirdpersoncharacter],
    }).compileComponents();

    fixture = TestBed.createComponent(Thirdpersoncharacter);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
