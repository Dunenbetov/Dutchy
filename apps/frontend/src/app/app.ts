import { Component, inject } from '@angular/core';
import { AppShellComponent } from './layout/app-shell.component';
import { ReceiptFlowStore } from './core/receipt-flow.store';

@Component({
  selector: 'app-root',
  imports: [AppShellComponent],
  template: `
    <div class="min-h-dvh" [class.dark]="store.darkMode()">
      <div class="mx-auto flex max-w-lg flex-col px-4 py-4">
        <div class="mb-3 flex flex-wrap items-center justify-center gap-4 text-sm text-muted">
          <label class="flex cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              class="h-4 w-4 rounded border-border accent-accent"
              [checked]="store.frameEnabled()"
              (change)="store.setFrameEnabled($any($event.target).checked)"
              data-testid="toggle-frame"
            />
            Toggle mobile container view
          </label>
          <button
            type="button"
            class="rounded-full px-3 py-1 ring-1 ring-border"
            (click)="store.toggleDarkMode()"
            data-testid="toggle-dark"
          >
            {{ store.darkMode() ? 'Light' : 'Dark' }}
          </button>
        </div>

        <div
          class="mx-auto flex w-full flex-col transition-all"
          [class]="
            store.frameEnabled()
              ? 'max-w-[390px] min-h-[844px] overflow-x-hidden overflow-y-auto rounded-[2.5rem] bg-surface shadow-2xl ring-1 ring-stone-200'
              : 'min-h-dvh max-w-[390px] bg-surface'
          "
        >
          <div class="flex min-h-0 min-w-0 flex-1 flex-col p-5">
            <app-shell />
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }
    `,
  ],
})
export class App {
  readonly store = inject(ReceiptFlowStore);
}
