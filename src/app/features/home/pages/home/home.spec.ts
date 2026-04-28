import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { of } from 'rxjs';

import { Home } from './home';
import { EventService } from '../../../../core/services/event';

describe('Home', () => {
  let component: Home;
  let fixture: ComponentFixture<Home>;

  const eventServiceMock = {
    getAll: () => of([])
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [Home],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(Home);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});