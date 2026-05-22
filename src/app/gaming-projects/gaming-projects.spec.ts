import { ComponentFixture, TestBed } from '@angular/core/testing';

import { GamingProjects } from './gaming-projects';

describe('GamingProjects', () => {
  let component: GamingProjects;
  let fixture: ComponentFixture<GamingProjects>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [GamingProjects],
    }).compileComponents();

    fixture = TestBed.createComponent(GamingProjects);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
