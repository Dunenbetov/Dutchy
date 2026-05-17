import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';

@Component({
  selector: 'app-step-setup',
  imports: [FormsModule],
  template: `
    <section class="flex min-w-0 flex-col gap-6" data-testid="step-setup">
      <header>
        <h1 class="text-2xl font-bold tracking-tight text-text">Dutchy</h1>
        <p class="mt-1 text-sm text-muted">Snap a receipt and split the bill with friends.</p>
      </header>

      <div
        class="flex flex-col items-center gap-4 rounded-3xl border-2 border-dashed border-border bg-surface-elevated px-6 py-8"
        data-testid="upload-receipt"
      >
        <span
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl"
          aria-hidden="true"
          >📷</span
        >
        <p class="text-center text-sm text-muted">Add your receipt</p>
        <div class="flex w-full min-w-0 flex-col gap-2 sm:flex-row">
          <input
            #cameraInput
            type="file"
            accept="image/*"
            capture="environment"
            class="sr-only"
            data-testid="upload-receipt-camera"
            (change)="onFile($event)"
          />
          <input
            #galleryInput
            type="file"
            accept="image/*"
            class="sr-only"
            data-testid="upload-receipt-gallery"
            (change)="onFile($event)"
          />
          <button
            type="button"
            class="min-h-12 flex-1 rounded-2xl bg-accent px-4 font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
            (click)="cameraInput.click()"
          >
            Take photo
          </button>
          <button
            type="button"
            class="min-h-12 flex-1 rounded-2xl border border-border bg-surface px-4 font-semibold text-text transition hover:bg-accent-soft/40 active:scale-[0.98]"
            (click)="galleryInput.click()"
          >
            Photo library
          </button>
        </div>
        @if (store.receiptFile(); as file) {
          <span class="max-w-full truncate text-xs text-muted">{{ file.name }}</span>
        }
      </div>

      @if (store.receiptPreviewUrl(); as url) {
        <img
          [src]="url"
          alt="Receipt preview"
          class="max-h-40 w-full rounded-2xl object-cover ring-1 ring-border"
          width="390"
          height="160"
        />
      }

      <div class="flex min-w-0 flex-col gap-3">
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
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base leading-none text-muted hover:bg-surface hover:text-text"
                [attr.aria-label]="'Remove ' + friend.name"
                (click)="store.removeFriend(friend.id)"
              >
                ×
              </button>
            </span>
          }
        </div>
        <div class="flex min-w-0 items-stretch gap-2">
          <input
            type="text"
            class="field-input min-w-0 flex-1 basis-0"
            placeholder="Friend name"
            [(ngModel)]="friendName"
            (keydown.enter)="addFriend()"
            data-testid="friend-name-input"
          />
          <button
            type="button"
            class="h-11 shrink-0 rounded-2xl bg-accent px-5 font-semibold text-white transition hover:brightness-105 active:scale-[0.98]"
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
    input.value = '';
  }

  addFriend(): void {
    this.store.addFriend(this.friendName);
    this.friendName = '';
  }
}
