import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EventCreate } from './event-create';

describe('EventCreate', () => {
  let component: EventCreate;
  let fixture: ComponentFixture<EventCreate>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventCreate],
    }).compileComponents();

    fixture = TestBed.createComponent(EventCreate);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
