import { Injectable, signal, computed } from '@angular/core';

export type AppTheme = 'light' | 'dark';

const STORAGE_KEY = 'eventmanager_theme';

function readStoredTheme(): AppTheme | null {
  try {
    const v = localStorage.getItem(STORAGE_KEY);
    if (v === 'light' || v === 'dark') return v;
  } catch {
    /* ignore */
  }
  return null;
}

function systemPrefersDark(): boolean {
  return window.matchMedia?.('(prefers-color-scheme: dark)')?.matches ?? false;
}

@Injectable({ providedIn: 'root' })
export class ThemeService {
  /** Sincronizado com `document.documentElement.dataset.theme` (definido no index.html). */
  readonly theme = signal<AppTheme>(this.readInitialTheme());

  readonly isDark = computed(() => this.theme() === 'dark');

  constructor() {
    this.applyDom(this.theme(), false);
  }

  private readInitialTheme(): AppTheme {
    const attr = document.documentElement.getAttribute('data-theme');
    if (attr === 'light' || attr === 'dark') return attr;
    const stored = readStoredTheme();
    if (stored) return stored;
    return systemPrefersDark() ? 'dark' : 'light';
  }

  /** Alterna e persiste a escolha do usuário. */
  toggle(): void {
    const next: AppTheme = this.theme() === 'dark' ? 'light' : 'dark';
    this.setTheme(next, true);
  }

  setTheme(next: AppTheme, persist: boolean): void {
    this.theme.set(next);
    this.applyDom(next, persist);
  }

  private applyDom(next: AppTheme, persist: boolean): void {
    document.documentElement.setAttribute('data-theme', next);
    if (persist) {
      try {
        localStorage.setItem(STORAGE_KEY, next);
      } catch {
        /* ignore */
      }
    }
    const meta = document.querySelector('meta[name="theme-color"]');
    if (meta) {
      meta.setAttribute('content', next === 'dark' ? '#0f172a' : '#f3f4f6');
    }
  }
}
