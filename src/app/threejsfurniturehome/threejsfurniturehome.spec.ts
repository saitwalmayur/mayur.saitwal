import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Threejsfurniturehome } from './threejsfurniturehome';

describe('Threejsfurniturehome', () => {
  let component: Threejsfurniturehome;
  let fixture: ComponentFixture<Threejsfurniturehome>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Threejsfurniturehome],
    }).compileComponents();

    fixture = TestBed.createComponent(Threejsfurniturehome);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
