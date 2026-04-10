import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-participant-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './participant-form.component.html',
  styleUrls: ['./participant-form.component.css']
})
export class ParticipantFormComponent {

  participant = {
    name: '',
    email: '',
    phone: ''
  };

  addParticipant() {
    console.log(this.participant);
    alert('Participante inscrito!');
  }
}