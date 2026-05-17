import { Injectable, signal } from '@angular/core';
import {
  type Locale,
  type TranslationKey,
  translations,
} from './translations';

const STORAGE_KEY = 'dutchy-locale';

@Injectable({ providedIn: 'root' })
export class LocaleService {
  readonly locale = signal<Locale>(this.loadInitial());

  t(key: TranslationKey, params?: Record<string, string | number>): string {
    const table = translations[this.locale()];
    let text: string = table[key] ?? translations.en[key] ?? key;
    if (params) {
      for (const [name, value] of Object.entries(params)) {
        text = text.replaceAll(`{${name}}`, String(value));
      }
    }
    return text;
  }

  toggleLocale(): void {
    this.setLocale(this.locale() === 'ru' ? 'en' : 'ru');
  }

  setLocale(locale: Locale): void {
    this.locale.set(locale);
    try {
      localStorage.setItem(STORAGE_KEY, locale);
    } catch {
      /* private mode */
    }
    document.documentElement.lang = locale;
  }

  private loadInitial(): Locale {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored === 'en' || stored === 'ru') return stored;
    } catch {
      /* private mode */
    }
    const lang = navigator.language.toLowerCase();
    return lang.startsWith('ru') ? 'ru' : 'en';
  }
}
