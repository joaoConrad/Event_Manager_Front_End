import { ComponentFixture, TestBed } from '@angular/core/testing';
import { EventList } from './event-list';
import { provideRouter } from '@angular/router'; // 👈 IMPORTANTE

describe('EventList', () => {
  let component: EventList;
  let fixture: ComponentFixture<EventList>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EventList],
      providers: [
        provideRouter([]) // 👈 ISSO RESOLVE O ERRO
      ]
    }).compileComponents();

    fixture = TestBed.createComponent(EventList);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});