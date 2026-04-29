import { Component, OnInit } from '@angular/core';
import { EventService } from '../../../core/services/event';
import { CommonModule } from '@angular/common';
import { Chart } from 'chart.js/auto';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit {

  events: any[] = [];
  chart: any;

  constructor(private eventService: EventService) {}

  ngOnInit() {
    this.eventService.getEventsWithCount().subscribe(data => {
      this.events = data;
      setTimeout(() => this.createChart(), 0); // garante que o HTML carregou
    });
  }

  createChart() {
    const canvas = document.getElementById('chart') as HTMLCanvasElement;
    if (!canvas) return;

    const labels = this.events.map(e => e.name);
    const data = this.events.map(e => e.totalParticipants);

    // 🔥 destrói gráfico anterior se existir
    if (this.chart) {
      this.chart.destroy();
    }

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'Inscritos por evento',
          data: data,
          backgroundColor: '#2563eb', // azul do teu sistema
          borderRadius: 6
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: {
            display: true
          }
        }
      }
    });
  }

  getTotalGeral(): number {
    return this.events.reduce((total, event) => total + event.totalParticipants, 0);
  }
}