import { ComponentFixture, TestBed } from '@angular/core/testing';

import { Threejspoolgame } from './threejspoolgame';

describe('Threejspoolgame', () => {
  let component: Threejspoolgame;
  let fixture: ComponentFixture<Threejspoolgame>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Threejspoolgame],
    }).compileComponents();

    fixture = TestBed.createComponent(Threejspoolgame);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
