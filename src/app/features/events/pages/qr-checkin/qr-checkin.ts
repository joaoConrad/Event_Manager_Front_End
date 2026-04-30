import { AfterViewInit, ChangeDetectorRef, Component, OnDestroy, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/services/auth';
import { ParticipantService } from '../../../../core/services/participant';

// Quando o back implementar GET /api/events/:id/participants/me
// importar aqui e usar participantService.getMySubscription(eventId)

type CheckinState = 'idle' | 'scanning' | 'success' | 'error' | 'already';

@Component({
  selector: 'app-qr-checkin',
  standalone: true,
  imports: [RouterLink, FormsModule],
  templateUrl:'./qr-checkin.html',
  styleUrl: './qr-checkin.css'
})
export class QrCheckin implements OnInit, AfterViewInit, OnDestroy {

  eventId: number | null = null;
  loading = true;

  // ── Estado do usuário comum ──────────────────────────
  // Quando back implementar, substituir por dado real do endpoint
  registrationCode: string | null = null; // TODO: GET /api/events/:id/participants/me → registrationCode
  isCheckedIn = false;                    // TODO: idem → isCheckedIn
  qrDataUrl: string | null = null;        // gerado localmente pela lib qrcode

  // ── Estado do admin ──────────────────────────────────
  checkinState: CheckinState = 'idle';
  checkinResult: string | null = null;
  scannerActive = false;

  // Simulação de código lido (substituir por leitura real de câmera)
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
    this.loadSubscription();
  }

  ngAfterViewInit(): void {
    // Quando back implementar e registrationCode estiver disponível,
    // gerar o QR code aqui usando: npm install qrcode
    // import QRCode from 'qrcode';
    // QRCode.toDataURL(this.registrationCode).then(url => { this.qrDataUrl = url; });
  }

  ngOnDestroy(): void {
    this.stopScanner();
  }

  loadSubscription(): void {
    this.loading = true;

    // TODO: quando back implementar GET /api/events/:id/participants/me
    // this.participantService.getMySubscription(this.eventId!).subscribe({
    //   next: (sub) => {
    //     this.registrationCode = sub.registrationCode;
    //     this.isCheckedIn = sub.isCheckedIn;
    //     this.loading = false;
    //     this.generateQr();
    //   }
    // });

    // Por ora: simula carregamento e mostra placeholder
    setTimeout(() => {
      this.loading = false;
      this.cdr.detectChanges();
    }, 600);
  }

  generateQr(): void {
    // Instalar: npm install qrcode @types/qrcode
    // import QRCode from 'qrcode';
    // QRCode.toDataURL(this.registrationCode!, { width: 280, margin: 2 })
    //   .then(url => { this.qrDataUrl = url; this.cdr.detectChanges(); });
  }

  // ── Admin: check-in ───────────────────────────────────

  startScanner(): void {
    this.scannerActive = true;
    this.checkinState = 'scanning';
    // TODO: integrar com BarcodeDetector API ou biblioteca como zxing-js/browser
    // https://developer.mozilla.org/en-US/docs/Web/API/BarcodeDetector
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

  private performCheckin(code: string): void {
    this.checkinState = 'idle';

    // TODO: qnd o back implementar POST /api/events/:id/checkin
    // this.http.post(`/api/events/${this.eventId}/checkin`, { registrationCode: code }, {
    //   headers: this.authService.getAuthHeaders()
    // }).subscribe({
    //   next: (res: any) => {
    //     this.checkinState = 'success';
    //     this.checkinResult = res.participant?.name ?? 'Participante';
    //   },
    //   error: (err) => {
    //     this.checkinState = err.status === 409 ? 'already' : 'error';
    //     this.checkinResult = err.error?.message ?? null;
    //   }
    // });

    // Placeholder visual enquanto back não implementa
    this.checkinState = 'error';
    this.checkinResult = 'Endpoint POST /api/events/:id/checkin ainda não implementado.';
    this.cdr.detectChanges();
  }

  resetCheckin(): void {
    this.checkinState = 'idle';
    this.checkinResult = null;
    this.manualCode = '';
    this.cdr.detectChanges();
  }
}