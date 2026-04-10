import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ParticipantForm } from './participant-form';

describe('ParticipantForm', () => {
  let component: ParticipantForm;
  let fixture: ComponentFixture<ParticipantForm>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ParticipantForm],
    }).compileComponents();

    fixture = TestBed.createComponent(ParticipantForm);
    component = fixture.componentInstance;
    await fixture.whenStable();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
