import { Component, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { ActivatedRoute } from '@angular/router';
import { Router } from '@angular/router';

interface Speaker {
  id?: number;
  name: string;
  miniBio: string;
  topics: string[];
  schedule: string;
}

@Component({
  selector: 'app-speakers',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './speakers.component.html',
  styleUrls: ['./speakers.component.css']
  })
  export class SpeakersComponent implements OnInit {

  constructor(private route: ActivatedRoute, private router: Router) {}
  eventId: number | null = null;
  speakers: Speaker[] = [];
  speaker: Speaker = {} as Speaker;
  topicsInput: string = '';

  ngOnInit() {
  this.eventId = Number(this.route.snapshot.queryParamMap.get('eventId'));
  console.log('Event ID recebido:', this.eventId);
  }

  save() {
    this.speaker.topics = this.topicsInput.split(',');

    if (this.speaker.id) {
      this.updateSpeaker();
    } else {
      this.createSpeaker();
    }
  }

  createSpeaker() {
  this.speaker.id = Date.now();

  const existing = JSON.parse(localStorage.getItem('speakers') || '[]');

  existing.push({
    ...this.speaker,
    eventId: this.eventId // 👈 IMPORTANTE
  });

  localStorage.setItem('speakers', JSON.stringify(existing));

  this.resetForm();

  this.router.navigate(['/events', this.eventId]);

  alert('Palestrante salvo!');
}

  updateSpeaker() {
    const index = this.speakers.findIndex(s => s.id === this.speaker.id);
    if (index !== -1) {
      this.speakers[index] = { ...this.speaker };
    }
    this.resetForm();
  }

  edit(s: Speaker) {
    this.speaker = { ...s };
    this.topicsInput = s.topics.join(',');
  }

  delete(id: number | undefined) {
    this.speakers = this.speakers.filter(s => s.id !== id);
  }

  resetForm() {
    this.speaker = {} as Speaker;
    this.topicsInput = '';
  }
}
