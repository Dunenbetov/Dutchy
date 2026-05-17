import { Component, effect, inject } from '@angular/core';
import { AppShellComponent } from './layout/app-shell.component';
import { ReceiptFlowStore } from './core/receipt-flow.store';
import { LocaleService } from './core/i18n/locale.service';

@Component({
  selector: 'app-root',
  imports: [AppShellComponent],
  template: `
    <div
      class="flex min-h-dvh w-full flex-col bg-surface px-[max(1rem,env(safe-area-inset-left))] pr-[max(1rem,env(safe-area-inset-right))] pt-[max(0.5rem,env(safe-area-inset-top))]"
    >
      <app-shell class="min-h-0 flex-1" />
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
        width: 100%;
        min-height: 100dvh;
      }
    `,
  ],
})
export class App {
  readonly store = inject(ReceiptFlowStore);
  private readonly i18n = inject(LocaleService);

  constructor() {
    document.documentElement.lang = this.i18n.locale();

    effect(() => {
      const dark = this.store.darkMode();
      document.documentElement.classList.toggle('dark', dark);
      document
        .querySelector('meta[name="theme-color"]')
        ?.setAttribute('content', dark ? '#1c1917' : '#faf8f5');
    });

    effect(() => {
      document.documentElement.lang = this.i18n.locale();
    });
  }
}
