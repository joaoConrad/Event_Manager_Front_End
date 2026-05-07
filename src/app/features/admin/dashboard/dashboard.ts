import { Component, OnInit, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

import {
  Chart,
  registerables,
  ChartConfiguration,
  ChartType
} from 'chart.js';

import { BaseChartDirective } from 'ng2-charts';

import { EventService } from '../../../core/services/event';

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
  imports: [
    CommonModule,
    RouterLink,
    BaseChartDirective
  ],
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

  // =========================
  // GRÁFICO DE BARRAS
  // =========================

  public barChartType: ChartType = 'bar';

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [
      {
        data: [],
        label: 'Inscritos',
        backgroundColor: '#2563eb'
      }
    ]
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true
      }
    }
  };

  // =========================
  // GRÁFICO PIZZA
  // =========================

  public pieChartType: ChartType = 'pie';

  public pieChartData = {
    labels: ['Ativos', 'Esgotados', 'Encerrados'],
    datasets: [
      {
        data: [0, 0, 0],
        backgroundColor: [
          '#2563eb',
          '#dc2626',
          '#6b7280'
        ]
      }
    ]
  };

  constructor(
    private readonly eventService: EventService
  ) {}

  ngOnInit(): void {
    this.loadData();
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.chart?.destroy();
  }

  loadData(): void {

    this.loading = true;

    this.eventService.getEventsWithCount().subscribe({

      next: (data) => {

        const now = Date.now();

        this.events = data.map((e) => {

          const timeStr = e.startTime ?? e.time ?? '00:00';

          const isPast =
            new Date(`${e.date}T${timeStr}`).getTime() < now;

          const total =
            e.totalParticipants ??
            e.registeredParticipants ??
            0;

          const max =
            e.maxParticipants ?? 1;

          return {
            id: e.id,
            title: e.title,
            date: e.date,
            maxParticipants: max,
            totalParticipants: total,
            occupancyPercent: Math.round((total / max) * 100),
            isSoldOut: total >= max,
            isPast
          };
        });

        this.computeStats();

        this.updateCharts();

        this.loading = false;

      },

      error: (err) => {
        console.error('Erro ao carregar dashboard:', err);
        this.loading = false;
      }

    });

  }

  private computeStats(): void {

    const upcoming =
      this.events.filter(e => !e.isPast);

    this.stats = {

      totalEvents:
        this.events.length,

      totalParticipants:
        this.events.reduce(
          (s, e) => s + e.totalParticipants,
          0
        ),

      averageOccupancy:
        this.events.length
          ? Math.round(
              this.events.reduce(
                (s, e) => s + e.occupancyPercent,
                0
              ) / this.events.length
            )
          : 0,

      upcomingEvents:
        upcoming.length
    };

  }

  private updateCharts(): void {

    // =========================
    // BARRAS
    // =========================

    this.barChartData = {

      labels: this.events.map(e => e.title),

      datasets: [
        {
          data: this.events.map(e => e.totalParticipants),
          label: 'Inscritos',
          backgroundColor: '#2563eb'
        }
      ]
    };

    // =========================
    // PIZZA
    // =========================

    const active =
      this.events.filter(
        e => !e.isPast && !e.isSoldOut
      ).length;

    const soldOut =
      this.events.filter(
        e => e.isSoldOut && !e.isPast
      ).length;

    const closed =
      this.events.filter(
        e => e.isPast
      ).length;

    this.pieChartData = {
      labels: ['Ativos', 'Esgotados', 'Encerrados'],
      datasets: [
        {
          data: [
            active,
            soldOut,
            closed
          ],
          backgroundColor: [
            '#2563eb',
            '#dc2626',
            '#6b7280'
          ]
        }
      ]
    };

  }

  getTotalGeral(): number {
    return this.stats.totalParticipants;
  }

  getOccupancyColor(pct: number): string {

    if (pct >= 90) {
      return '#dc2626';
    }

    if (pct >= 60) {
      return '#d97706';
    }

    return '#059669';

  }

  getStatusLabel(event: EventWithCount): string {

    if (event.isPast) {
      return 'Encerrado';
    }

    if (event.isSoldOut) {
      return 'Esgotado';
    }

    return 'Ativo';

  }

  getStatusClass(event: EventWithCount): string {

    if (event.isPast) {
      return 'badge-closed';
    }

    if (event.isSoldOut) {
      return 'badge-sold-out';
    }

    return 'badge-active';

  }

}