import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import { SafeUrlPipe } from '../../core/safe-url.pipe';

@Component({
  selector: 'app-step-setup',
  imports: [FormsModule, TranslatePipe, SafeUrlPipe],
  template: `
    <section class="flex min-w-0 flex-col gap-6" data-testid="step-setup">
      <header class="flex items-center gap-4">
        <!-- Decorative glass hero badge -->
        <span
          class="flex h-16 w-16 shrink-0 items-center justify-center rounded-[22px] bg-gradient-to-br from-accent to-success text-3xl ring-1 ring-white/40 shadow-[0_12px_28px_-12px_rgba(28,25,23,0.45),inset_0_1px_0_rgba(255,255,255,0.45)]"
          aria-hidden="true"
          >🧾</span
        >
        <div class="min-w-0">
          <h1 class="text-2xl font-bold tracking-tight text-text">{{ 'app.title' | t }}</h1>
          <p class="mt-1 text-sm text-muted">{{ 'app.tagline' | t }}</p>
        </div>
      </header>

      <div
        class="glass flex flex-col items-center gap-4 rounded-3xl px-6 py-8"
        data-testid="upload-receipt"
      >
        <span
          class="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent-soft text-2xl"
          aria-hidden="true"
          >📷</span
        >
        <p class="text-center text-sm text-muted">{{ 'setup.addReceipt' | t }}</p>
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
            class="glass-accent min-h-12 flex-1 rounded-2xl px-4 font-semibold text-white active:scale-[0.98]"
            (click)="cameraInput.click()"
          >
            {{ 'setup.takePhoto' | t }}
          </button>
          <button
            type="button"
            class="glass-pill min-h-12 flex-1 rounded-2xl px-4 font-semibold text-text transition active:scale-[0.98]"
            (click)="galleryInput.click()"
          >
            {{ 'setup.photoLibrary' | t }}
          </button>
        </div>
        @if (store.receiptFile(); as file) {
          <span class="max-w-full truncate text-xs text-muted">{{ file.name }}</span>
        }
      </div>

      @if (store.receiptPreviewUrl(); as url) {
        <img
          [src]="url | safeUrl"
          [alt]="'setup.receiptPreviewAlt' | t"
          class="max-h-48 min-h-24 w-full rounded-2xl bg-surface-elevated/60 object-contain ring-1 ring-border"
          width="390"
          height="192"
          decoding="async"
          data-testid="receipt-preview"
        />
      }

      <div class="flex min-w-0 flex-col gap-3">
        <h2 class="text-sm font-semibold uppercase tracking-wide text-muted">
          {{ 'setup.friends' | t }}
        </h2>
        <div class="flex flex-wrap gap-2">
          @for (friend of store.friends(); track friend.id) {
            <span
              class="glass-pill inline-flex items-center gap-1 rounded-full px-3 py-1.5 text-sm font-medium text-text"
              data-testid="friend-chip"
            >
              {{ friend.name }}
              <button
                type="button"
                class="inline-flex h-6 w-6 shrink-0 items-center justify-center rounded-full text-base leading-none text-muted hover:bg-surface/60 hover:text-text"
                [attr.aria-label]="'setup.removeFriend' | t: { name: friend.name }"
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
            class="field-input field-glass min-w-0 flex-1 basis-0"
            [placeholder]="'setup.friendPlaceholder' | t"
            [(ngModel)]="friendName"
            (keydown.enter)="addFriend()"
            data-testid="friend-name-input"
          />
          <button
            type="button"
            class="glass-accent h-11 shrink-0 rounded-2xl px-5 font-semibold text-white active:scale-[0.98]"
            (click)="addFriend()"
            data-testid="add-friend-btn"
          >
            {{ 'setup.add' | t }}
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
