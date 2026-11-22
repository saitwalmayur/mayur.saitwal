import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Pixijshome } from './pixijshome';

describe('Pixijshome', () => {
  let component: Pixijshome;
  let fixture: ComponentFixture<Pixijshome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Pixijshome],
    }).compileComponents();

    fixture = TestBed.createComponent(Pixijshome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
