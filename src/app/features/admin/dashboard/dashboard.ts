import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import { Chart, registerables } from 'chart.js';
import { EventModel } from '../../../models/event.model';
import { EventoService } from '../../../services/evento.service';

Chart.register(...registerables);

interface DashboardStats {
  totalEvents: number;
  totalParticipants: number;
  averageOccupancy: number;
  upcomingEvents: number;
}

interface EventWithCount {
  id?: number;
  title: string;
  date: string;
  maxParticipants: number;
  totalParticipants: number;
  occupancyPercent: number;
  isSoldOut: boolean;
  isPast: boolean;
}

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {

  events: EventWithCount[] = [];
  loading = true;

  stats: DashboardStats = {
    totalEvents: 0,
    totalParticipants: 0,
    averageOccupancy: 0,
    upcomingEvents: 0
  };

  private chart: Chart | null = null;

  readonly tableColumns = ['Evento', 'Data', 'Inscritos', 'Capacidade', 'Ocupação', 'Status'];

  constructor(private readonly eventService: EventoService) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  loadData(): void {
    this.loading = true;

    // 🔥 USANDO SERVICE TIPADO (SEM ANY)
    this.eventService.getEvents().subscribe({
      next: (res) => {
        const now = Date.now();

        this.events = res.data.map((e: EventModel) => {
          const isPast = new Date(`${e.date}T${e.time ?? '00:00'}`).getTime() < now;

          const total = e.registeredParticipants ?? 0;
          const max = e.maxParticipants ?? 1;

          const occupancy = Math.round((total / max) * 100);

          return {
            id: e.id,
            title: e.name || e.title,
            date: e.date,
            maxParticipants: max,
            totalParticipants: total,
            occupancyPercent: occupancy,
            isSoldOut: total >= max,
            isPast
          };
        });

        this.computeStats();
        this.loading = false;

        setTimeout(() => this.buildChart(), 0);
      },
      error: (err) => {
        console.error('Erro ao carregar eventos:', err);
        this.loading = false;
      }
    });
  }

  private computeStats(): void {
    const upcoming = this.events.filter(e => !e.isPast);

    this.stats = {
      totalEvents: this.events.length,
      totalParticipants: this.events.reduce((s, e) => s + e.totalParticipants, 0),
      averageOccupancy: this.events.length
        ? Math.round(this.events.reduce((s, e) => s + e.occupancyPercent, 0) / this.events.length)
        : 0,
      upcomingEvents: upcoming.length
    };
  }

  getTotalGeral(): number {
    return this.stats.totalParticipants;
  }

  getOccupancyColor(pct: number): string {
    if (pct >= 90) return '#dc2626';
    if (pct >= 60) return '#d97706';
    return '#059669';
  }

  getStatusLabel(event: EventWithCount): string {
    if (event.isPast) return 'Encerrado';
    if (event.isSoldOut) return 'Esgotado';
    return 'Ativo';
  }

  getStatusClass(event: EventWithCount): string {
    if (event.isPast) return 'badge-closed';
    if (event.isSoldOut) return 'badge-sold-out';
    return 'badge-active';
  }

  private buildChart(): void {
    const canvas = document.getElementById('dashChart') as HTMLCanvasElement | null;
    if (!canvas || this.events.length === 0) return;

    this.chart?.destroy();

    const upcoming = this.events.filter(e => !e.isPast).slice(0, 10);

    const labels = upcoming.map(e =>
      e.title.length > 20 ? e.title.slice(0, 18) + '…' : e.title
    );

    const inscribed = upcoming.map(e => e.totalParticipants);
    const available = upcoming.map(e => Math.max(e.maxParticipants - e.totalParticipants, 0));

    this.chart = new Chart(canvas, {
      type: 'bar',
      data: {
        labels,
        datasets: [
          {
            label: 'Inscritos',
            data: inscribed,
            backgroundColor: '#2563eb',
            borderRadius: 6
          },
          {
            label: 'Vagas restantes',
            data: available,
            backgroundColor: '#e0e7ff',
            borderRadius: 6
          }
        ]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { position: 'top' }
        },
        scales: {
          x: { stacked: true },
          y: { stacked: true, beginAtZero: true }
        }
      }
    });
  }
}