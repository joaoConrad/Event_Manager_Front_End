import { ComponentFixture, TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { ActivatedRoute } from '@angular/router';
import { of } from 'rxjs';

import { EventCreate } from './event-create';
import { EventService } from '../../../../core/services/event';

describe('EventCreate', () => {
  let component: EventCreate;
  let fixture: ComponentFixture<EventCreate>;

  const eventServiceMock = {
    getById: () => of(null),
    create: () => of({}),
    update: () => of({})
  };

  const activatedRouteMock = {
    snapshot: {
      paramMap: {
        get: () => null
      }
    }
  };

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCreate],
      providers: [
        provideRouter([]),
        { provide: EventService, useValue: eventServiceMock },
        { provide: ActivatedRoute, useValue: activatedRouteMock }
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventCreate);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});