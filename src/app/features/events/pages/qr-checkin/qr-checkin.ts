import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { ParticipantService, MySubscription } from '../../../../core/services/participant';

type CheckinState = 'idle' | 'scanning' | 'success' | 'error' | 'already' | 'not-registered';

// Intervalo do polling em ms — busca o status a cada 5 segundos
const POLL_INTERVAL_MS = 5000;

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

  // Timer do polling — cancelado no ngOnDestroy
  private pollTimer: ReturnType<typeof setInterval> | null = null;

  get isCheckedIn(): boolean { return this.subscription?.isCheckedIn === true; }
  get subscriptionToken(): string | null { return this.subscription?.subscriptionToken ?? null; }
  get approvalStatus(): string { return this.subscription?.approvalStatus ?? 'approved'; }
  get isPendingApproval(): boolean { return this.approvalStatus === 'pending'; }
  get isRejectedApproval(): boolean { return this.approvalStatus === 'rejected'; }
  get canShowQr(): boolean { return this.approvalStatus === 'approved'; }

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

    // admin não precisa carregar sua própria inscrição nem iniciar polling
    if (!this.authService.isAdmin() && this.authService.isLoggedIn()) {
      this.loadSubscription();
    } else {
      this.loading = false;
    }
  }

  ngAfterViewInit(): void {}

  ngOnDestroy(): void {
    this.stopScanner();
    this.stopPolling();
  }

  // ── Carrega inscrição do usuário ───────────────────────

  loadSubscription(): void {
    if (!this.eventId) { this.loading = false; return; }

    this.loading = true;
    this.participantService.getMySubscription(this.eventId).subscribe({
      next: (res) => {
        this.subscription = res.data;
        this.loading = false;
        if (this.canShowQr) {
          this.generateQr();
        } else {
          this.qrDataUrl = null;
        }
        this.cdr.detectChanges();

        // Inicia polling apenas se o check-in ainda não foi feito.
        // Se já está confirmado quando o usuário abre a tela, não há necessidade.
        if (!this.subscription?.isCheckedIn) {
          this.startPolling();
        }
      },
      error: (err) => {
        this.loading = false;
        if (err.status === 404) {
          this.checkinState = 'not-registered';
        }
        this.cdr.detectChanges();
      }
    });
  }

  // ── Polling: atualiza status do check-in silenciosamente ──

  private startPolling(): void {
    this.stopPolling(); // garante que não haja timer duplicado

    this.pollTimer = setInterval(() => {
      if (!this.eventId || !this.authService.isLoggedIn()) {
        this.stopPolling();
        return;
      }

      this.participantService.getMySubscription(this.eventId).subscribe({
        next: (res) => {
          const wasCheckedIn = this.subscription?.isCheckedIn;
          this.subscription = res.data;

          // Assim que o check-in for confirmado: para o polling e atualiza a tela
          if (this.canShowQr && !this.qrDataUrl) {
            this.generateQr();
          }

          if (!wasCheckedIn && res.data.isCheckedIn) {
            this.stopPolling();
            this.cdr.detectChanges();
          }
        },
        error: () => {
          // Silencia erros de polling para não atrapalhar a experiência
        }
      });
    }, POLL_INTERVAL_MS);
  }

  private stopPolling(): void {
    if (this.pollTimer !== null) {
      clearInterval(this.pollTimer);
      this.pollTimer = null;
    }
  }

  // ── Gera QR code ───────────────────────────────────────

  generateQr(): void {
    if (!this.subscriptionToken || !this.canShowQr) return;

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

    this.participantService.checkIn(this.eventId, token).subscribe({
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
