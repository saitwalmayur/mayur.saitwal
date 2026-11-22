import { ComponentFixture, TestBed } from '@angular/core/testing';
import { PixijsFruitmerge } from './pixijs-fruitmerge';

describe('PixijsFruitmerge', () => {
  let component: PixijsFruitmerge;
  let fixture: ComponentFixture<PixijsFruitmerge>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PixijsFruitmerge],
    }).compileComponents();

    fixture = TestBed.createComponent(PixijsFruitmerge);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
