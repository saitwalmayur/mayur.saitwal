import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Match3game } from './match3game';

describe('Match3game', () => {
  let component: Match3game;
  let fixture: ComponentFixture<Match3game>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Match3game],
    }).compileComponents();

    fixture = TestBed.createComponent(Match3game);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
