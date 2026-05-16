import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';

@Component({
  selector: 'app-step-setup',
  imports: [FormsModule],
  template: `
    <section class="flex flex-col gap-6" data-testid="step-setup">
      <header>
        <h1 class="text-2xl font-bold tracking-tight text-text">Split the receipt</h1>
        <p class="mt-1 text-sm text-muted">Snap a photo and add everyone at the table.</p>
      </header>

      <label
        class="flex cursor-pointer flex-col items-center justify-center gap-3 rounded-3xl border-2 border-dashed border-border bg-surface-elevated px-6 py-10 transition hover:border-accent hover:bg-accent-soft/40"
        data-testid="upload-receipt"
      >
        <input
          type="file"
          accept="image/*"
          capture="environment"
          class="sr-only"
          (change)="onFile($event)"
        />
        <span
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl"
          aria-hidden="true"
          >📷</span
        >
        <span class="text-center font-semibold text-text">Take photo / Upload receipt</span>
        @if (store.receiptFile(); as file) {
          <span class="text-xs text-muted">{{ file.name }}</span>
        }
      </label>

      @if (store.receiptPreviewUrl(); as url) {
        <img
          [src]="url"
          alt="Receipt preview"
          class="max-h-40 w-full rounded-2xl object-cover ring-1 ring-border"
          width="390"
          height="160"
        />
      }

      <div class="flex flex-col gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">Friends</h2>
        <div class="flex flex-wrap gap-2">
          @for (friend of store.friends(); track friend.id) {
            <span
              class="inline-flex items-center gap-1 rounded-full bg-accent-soft px-3 py-1.5 text-sm font-medium text-text"
              data-testid="friend-chip"
            >
              {{ friend.name }}
              <button
                type="button"
                class="ml-1 min-h-6 min-w-6 rounded-full text-muted hover:bg-surface-elevated hover:text-text"
                [attr.aria-label]="'Remove ' + friend.name"
                (click)="store.removeFriend(friend.id)"
              >
                ×
              </button>
            </span>
          }
        </div>
        <div class="flex gap-2">
          <input
            type="text"
            class="min-h-11 flex-1 rounded-2xl border border-border bg-surface-elevated px-4 text-text outline-none focus:ring-2 focus:ring-accent/40"
            placeholder="Friend name"
            [(ngModel)]="friendName"
            (keydown.enter)="addFriend()"
            data-testid="friend-name-input"
          />
          <button
            type="button"
            class="min-h-11 min-w-11 rounded-2xl bg-accent px-4 font-semibold text-white transition active:scale-[0.98]"
            (click)="addFriend()"
            data-testid="add-friend-btn"
          >
            Add
          </button>
        </div>
      </div>
    </section>
  `,
})
export class StepSetupComponent {
  readonly store = inject(ReceiptFlowStore);
  friendName = '';

  async onFile(event: Event): Promise<void> {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0] ?? null;
    await this.store.setReceiptFile(file);
  }

  addFriend(): void {
    this.store.addFriend(this.friendName);
    this.friendName = '';
  }
}
