import { Component, inject } from '@angular/core';
import { ReceiptFlowStore, type WizardStep } from '../core/receipt-flow.store';
import { StepSetupComponent } from '../features/wizard/step-setup.component';
import { StepReviewComponent } from '../features/wizard/step-review.component';
import { StepAssignComponent } from '../features/wizard/step-assign.component';
import { StepSummaryComponent } from '../features/wizard/step-summary.component';

@Component({
  selector: 'app-shell',
  imports: [
    StepSetupComponent,
    StepReviewComponent,
    StepAssignComponent,
    StepSummaryComponent,
  ],
  template: `
    <div class="flex min-h-0 flex-1 flex-col">
      <div class="mb-4 flex items-center gap-3">
        <nav class="flex flex-1 justify-center gap-2" aria-label="Progress">
          @for (s of steps; track s) {
            <button
              type="button"
              class="h-2 w-8 rounded-full transition"
              [class]="store.step() >= s ? 'bg-accent' : 'bg-border'"
              [attr.aria-current]="store.step() === s ? 'step' : null"
              [attr.aria-label]="'Step ' + s"
              (click)="goStep(s)"
            ></button>
          }
        </nav>
        <button
          type="button"
          class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full text-xs font-semibold text-muted ring-1 ring-border transition hover:bg-surface-elevated hover:text-text"
          (click)="store.toggleDarkMode()"
          [attr.aria-label]="store.darkMode() ? 'Switch to light mode' : 'Switch to dark mode'"
          data-testid="toggle-dark"
        >
          {{ store.darkMode() ? 'Light' : 'Dark' }}
        </button>
      </div>

      <div class="min-h-0 flex-1 overflow-x-hidden overflow-y-auto">
        @switch (store.step()) {
          @case (1) {
            <app-step-setup />
          }
          @case (2) {
            <app-step-review />
          }
          @case (3) {
            <app-step-assign />
          }
          @case (4) {
            <app-step-summary />
          }
        }
      </div>

      <footer
        class="mt-4 flex shrink-0 gap-3 border-t border-border pt-4 pb-[max(0.5rem,env(safe-area-inset-bottom))]"
      >
        @if (store.step() > 1) {
          <button
            type="button"
            class="min-h-12 flex-1 rounded-2xl border border-border bg-surface-elevated font-semibold text-text"
            (click)="back()"
            data-testid="btn-back"
          >
            Back
          </button>
        }
        @if (store.step() < 4) {
          <button
            type="button"
            class="min-h-12 flex-[2] rounded-2xl bg-accent font-semibold text-white disabled:opacity-40"
            [disabled]="!store.canProceed()"
            (click)="next()"
            data-testid="btn-next"
          >
            {{ store.step() === 1 ? 'Parse receipt' : 'Continue' }}
          </button>
        } @else {
          <button
            type="button"
            class="min-h-12 flex-1 rounded-2xl border border-border font-semibold text-text"
            (click)="store.reset()"
            data-testid="btn-reset"
          >
            Start over
          </button>
        }
      </footer>
    </div>
  `,
})
export class AppShellComponent {
  readonly store = inject(ReceiptFlowStore);
  readonly steps: WizardStep[] = [1, 2, 3, 4];

  goStep(s: WizardStep): void {
    if (s <= this.store.step()) this.store.goToStep(s);
  }

  back(): void {
    this.store.prevStep();
  }

  async next(): Promise<void> {
    if (this.store.step() === 1) {
      await this.store.parseReceipt();
      return;
    }
    this.store.nextStep();
    if (this.store.step() === 3 && !this.store.activeFriendId()) {
      const first = this.store.friends()[0];
      if (first) this.store.setActiveFriend(first.id);
    }
  }
}
