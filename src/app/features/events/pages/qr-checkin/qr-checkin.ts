import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { ParticipantService, MySubscription } from '../../../../core/services/participant';

type CheckinState = 'idle' | 'scanning' | 'success' | 'error' | 'already' | 'not-registered';

@Component({
  selector: 'app-qr-checkin',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl: './qr-checkin.html',
  styleUrl: './qr-checkin.css'
})
export class QrCheckin implements OnInit, AfterViewInit, OnDestroy {

  eventId: number | null = null;
  loading = true;

  // ── Usuário comum ──────────────────────────────────────
  subscription: MySubscription | null = null;
  qrDataUrl: string | null = null;

  get isCheckedIn(): boolean { return this.subscription?.isCheckedIn === true; }
  get subscriptionToken(): string | null { return this.subscription?.subscriptionToken ?? null; }

  // ── Admin ──────────────────────────────────────────────
  checkinState: CheckinState = 'idle';
  checkinResult: string | null = null;
  scannerActive = false;
  manualCode = '';

  constructor(
    private readonly route: ActivatedRoute,
    public readonly authService: AuthService,
    private readonly participantService: ParticipantService,
    private readonly cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    const idParam = this.route.snapshot.paramMap.get('id');
    if (idParam && !isNaN(Number(idParam))) {
      this.eventId = Number(idParam);
    }

    // admin não precisa carregar sua própria inscrição
    if (!this.authService.isAdmin() && this.authService.isLoggedIn()) {
      this.loadSubscription();
    } else {
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {}
  ngOnDestroy(): void { this.stopScanner(); }

  // ── Carrega inscrição do usuário ───────────────────────

  loadSubscription(): void {
    if (!this.eventId) { this.loading = false; return; }

    this.loading = true;
    this.participantService.getMySubscription(this.eventId).subscribe({
      next: (res) => {
        this.subscription = res.data;
        this.loading = false;
        this.generateQr();
        this.cdr.detectChanges();
      },
      error: (err) => {
        this.loading = false;
        // 404 = usuário não está inscrito neste evento
        if (err.status === 404) {
          this.checkinState = 'not-registered';
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ── Gera QR code ───────────────────────────────────────

  generateQr(): void {
    if (!this.subscriptionToken) return;

    ///@types/qrcode
    import('qrcode').then((QRCode) => {
      QRCode.toDataURL(this.subscriptionToken!, {
        width: 280,
        margin: 2,
        color: { dark: '#0F2557', light: '#FFFFFF' }
      }).then(url => {
        this.qrDataUrl = url;
        this.cdr.detectChanges();
      });
    }).catch(() => {
      // lib não instalada — mostra placeholder
      this.qrDataUrl = null;
      this.cdr.detectChanges();
    });
  }

  // ── Admin: check-in via token ──────────────────────────

  startScanner(): void {
    this.scannerActive = true;
    this.checkinState = 'scanning';
    this.cdr.detectChanges();
  }

  stopScanner(): void {
    this.scannerActive = false;
    if (this.checkinState === 'scanning') this.checkinState = 'idle';
    this.cdr.detectChanges();
  }

  submitManualCode(): void {
    if (!this.manualCode.trim() || !this.eventId) return;
    this.performCheckin(this.manualCode.trim());
  }

  private performCheckin(token: string): void {
    if (!this.eventId) return;

    this.checkinState = 'idle';
    this.cdr.detectChanges();

    // O back tem GET /:id/validate/:token
    this.participantService.validateCheckin(this.eventId, token).subscribe({
      next: (res) => {
        this.checkinState = 'success';
        this.checkinResult = res.data?.name ?? 'Participante';
        this.manualCode = '';
        this.cdr.detectChanges();
      },
      error: (err) => {
        if (err.status === 409) {
          this.checkinState = 'already';
        } else {
          this.checkinState = 'error';
        }
        this.checkinResult = err.error?.error?.message ?? err.error?.message ?? null;
        this.cdr.detectChanges();
      }
    });
  }

  resetCheckin(): void {
    this.checkinState = 'idle';
    this.checkinResult = null;
    this.manualCode = '';
    this.cdr.detectChanges();
  }
}