import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { MaterialService } from '../../../../core/services/material.service';
import { MaterialModel, MaterialType } from '../../../../models/material.model';

interface EventGroup {
  eventId: number;
  eventTitle: string;
  eventDate: string;
  materials: MaterialModel[];
}

@Component({
  selector: 'app-participant-area',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './area.html',
  styleUrl: './area.css',
})
export class ParticipantArea implements OnInit {
  loading = true;
  searchQuery = '';
  allMaterials: MaterialModel[] = [];

  constructor(
    public readonly authService: AuthService,
    private readonly materialService: MaterialService,
    private readonly router: Router
  ) {}

  ngOnInit(): void {
    if (!this.authService.isLoggedIn()) {
      this.router.navigate(['/login']);
      return;
    }
    this.loadMaterials();
  }

  loadMaterials(): void {
    this.loading = true;
    this.materialService.getMaterials().subscribe({
      next: (materials) => {
        this.allMaterials = materials;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
      },
    });
  }

  get filteredMaterials(): MaterialModel[] {
    if (!this.searchQuery.trim()) return this.allMaterials;
    const q = this.searchQuery.toLowerCase();
    return this.allMaterials.filter(
      (m) =>
        m.title.toLowerCase().includes(q) ||
        m.eventTitle.toLowerCase().includes(q) ||
        m.description?.toLowerCase().includes(q)
    );
  }

  get groupedByEvent(): EventGroup[] {
    const map = new Map<number, EventGroup>();
    for (const m of this.filteredMaterials) {
      if (!map.has(m.eventId)) {
        map.set(m.eventId, {
          eventId: m.eventId,
          eventTitle: m.eventTitle,
          eventDate: m.eventDate,
          materials: [],
        });
      }
      map.get(m.eventId)!.materials.push(m);
    }
    return Array.from(map.values());
  }

  getTypeIcon(type: MaterialType): string {
    const icons: Record<MaterialType, string> = {
      pdf: '📄',
      video: '🎥',
      link: '🔗',
      image: '🖼️',
      zip: '📦',
    };
    return icons[type] ?? '📎';
  }

  getTypeLabel(type: MaterialType): string {
    const labels: Record<MaterialType, string> = {
      pdf: 'PDF',
      video: 'Vídeo',
      link: 'Link',
      image: 'Imagem',
      zip: 'Arquivo',
    };
    return labels[type] ?? type;
  }

  formatDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  }

  formatRelease(dateStr: string): string {
    const d = new Date(dateStr);
    return d.toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  handleDownload(material: MaterialModel): void {
    this.materialService.downloadMaterial(material).subscribe({
      next: (blob) => this.materialService.saveMaterialFile(material, blob),
      error: () => {}
    });
  }

  getInitials(): string {
    const user = this.authService.getUser();
    if (!user?.name) return '?';
    return user.name
      .split(' ')
      .slice(0, 2)
      .map((n) => n[0])
      .join('')
      .toUpperCase();
  }
}
