import { Component, OnInit, AfterViewInit, OnDestroy, ChangeDetectorRef } from '@angular/core';
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
  startDate: string;
  endDate: string;
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
  imports: [CommonModule, RouterLink, BaseChartDirective],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class Dashboard implements OnInit, AfterViewInit, OnDestroy {

  events: EventWithCount[] = [];
  loading = true;
  chartsReady = false;

  // ── Paginação da tabela ────────────────────────────────
  tablePage = 1;
  readonly tablePageSize = 10;

  get tablePages(): number {
    return Math.max(1, Math.ceil(this.events.length / this.tablePageSize));
  }

  pagedEvents(): EventWithCount[] {
    const start = (this.tablePage - 1) * this.tablePageSize;
    return this.events.slice(start, start + this.tablePageSize);
  }

  tableGoTo(page: number): void {
    if (page < 1 || page > this.tablePages) return;
    this.tablePage = page;
  }

  tablePageNumbers(): number[] {
    const total = this.tablePages;
    const cur = this.tablePage;
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    const pages: number[] = [1];
    if (cur > 3) pages.push(-1);
    for (let i = Math.max(2, cur - 1); i <= Math.min(total - 1, cur + 1); i++) pages.push(i);
    if (cur < total - 2) pages.push(-1);
    pages.push(total);
    return pages;
  }

  // ── Stats ──────────────────────────────────────────────
  stats: DashboardStats = {
    totalEvents: 0,
    totalParticipants: 0,
    averageOccupancy: 0,
    upcomingEvents: 0
  };

  private chart: Chart | null = null;

  // ── Gráfico de barras ──────────────────────────────────
  public barChartType: ChartType = 'bar';

  public barChartData: ChartConfiguration<'bar'>['data'] = {
    labels: [],
    datasets: [{ data: [], label: 'Inscritos', backgroundColor: '#2563eb' }]
  };

  public barChartOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: true } },
    scales: { y: { beginAtZero: true } }
  };

  // ── Gráfico de pizza ───────────────────────────────────
  public pieChartType: ChartType = 'pie';

  public pieChartData = {
    labels: ['Ativos', 'Esgotados', 'Encerrados'],
    datasets: [{
      data: [0, 0, 0],
      backgroundColor: ['#2563eb', '#dc2626', '#6b7280']
    }]
  };

  // FIX: maintainAspectRatio false + tamanho controlado pelo CSS do container
  public pieChartOptions: ChartConfiguration<'pie'>['options'] = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        display: true,
        position: 'bottom',
        labels: { padding: 16, font: { size: 13 } }
      }
    }
  };

  constructor(
    private readonly eventService: EventService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void { this.loadData(); }
  ngAfterViewInit(): void {}
  ngOnDestroy(): void { this.chart?.destroy(); }

  loadData(): void {
    this.loading = true;

    this.eventService.getEventsWithCount().subscribe({
      next: (response: any) => {
        const data = Array.isArray(response) ? response : response?.data || [];
        const now = Date.now();

        this.events = data.map((e: any) => {
          const startDate = this.normalizeDate(e.startDate ?? e.date);
          const endDate = this.normalizeDate(e.endDate ?? e.date ?? e.startDate);
          const timeStr = e.startTime ?? e.time ?? '00:00';
          const isPast = new Date(`${startDate}T${timeStr}`).getTime() < now;
          const total = e.totalParticipants ?? e.registeredParticipants ?? 0;
          const max = e.maxParticipants ?? 1;

          return {
            id: e.id,
            title: e.title ?? 'Evento sem nome',
            startDate,
            endDate,
            date: startDate === endDate ? startDate : `${startDate} - ${endDate}`,
            maxParticipants: max,
            totalParticipants: total,
            occupancyPercent: Math.min(Math.round((total / max) * 100), 100),
            isSoldOut: total >= max,
            isPast
          };
        });

        this.computeStats();
        this.updateCharts();
        this.loading = false;
        this.chartsReady = true;
        this.cdr.detectChanges();
      },
      error: (err) => {
        console.error('Erro ao carregar dashboard:', err);
        this.loading = false;
        this.cdr.detectChanges();
      }
    });
  }

  private computeStats(): void {
    const upcoming = this.events.filter(e => !e.isPast);
    this.stats = {
      totalEvents: this.events.length,
      totalParticipants: this.events.reduce((s, e) => s + e.totalParticipants, 0),
      averageOccupancy: this.events.length
        ? Math.min(Math.round(this.events.reduce((s, e) => s + e.occupancyPercent, 0) / this.events.length), 100)
        : 0,
      upcomingEvents: upcoming.length
    };
  }

  private updateCharts(): void {
    this.barChartData = {
      labels: this.events.map(e => e.title),
      datasets: [{ data: this.events.map(e => e.totalParticipants), label: 'Inscritos', backgroundColor: '#2563eb' }]
    };

    const active  = this.events.filter(e => !e.isPast && !e.isSoldOut).length;
    const soldOut = this.events.filter(e =>  e.isSoldOut && !e.isPast).length;
    const closed  = this.events.filter(e =>  e.isPast).length;

    this.pieChartData = {
      labels: ['Ativos', 'Esgotados', 'Encerrados'],
      datasets: [{ data: [active, soldOut, closed], backgroundColor: ['#2563eb', '#dc2626', '#6b7280'] }]
    };
  }

  getTotalGeral(): number { return this.stats.totalParticipants; }

  getOccupancyColor(pct: number): string {
    if (pct >= 90) return '#dc2626';
    if (pct >= 60) return '#d97706';
    return '#059669';
  }

  getStatusLabel(event: EventWithCount): string {
    if (event.isPast)    return 'Encerrado';
    if (event.isSoldOut) return 'Esgotado';
    return 'Ativo';
  }

  getStatusClass(event: EventWithCount): string {
    if (event.isPast)    return 'badge-closed';
    if (event.isSoldOut) return 'badge-sold-out';
    return 'badge-active';
  }

  private normalizeDate(date?: string): string {
    return date?.split('T')[0] ?? '';
  }
}
