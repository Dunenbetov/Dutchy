import { Component, inject, signal } from '@angular/core';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';
import { ShareService } from '../../core/share.service';
import { KztPipe } from '../../core/kzt.pipe';

@Component({
  selector: 'app-step-summary',
  imports: [KztPipe],
  template: `
    <section class="flex flex-col gap-5 pb-4" data-testid="step-summary">
      <header>
        <h1 class="text-2xl font-bold text-text">Summary</h1>
        <p class="mt-1 text-sm text-muted">
          @if (store.serviceCharge().present) {
            Includes service charge from the receipt.
          } @else {
            No service charge on this receipt.
          }
        </p>
      </header>

      @for (ft of store.friendTotals(); track ft.friendId) {
        <article
          class="rounded-3xl border border-border bg-surface-elevated p-5 shadow-sm"
          [attr.data-testid]="'summary-card-' + ft.friendName"
        >
          <h2 class="text-lg font-bold text-text">{{ ft.friendName }}</h2>
          <ul class="mt-3 space-y-2 border-b border-border pb-3">
            @for (li of ft.lineItems; track li.itemId) {
              <li class="flex justify-between gap-2 text-sm">
                <span class="text-text">{{ li.name }} ×{{ li.quantity }}</span>
                <span class="font-tabular text-muted">{{ li.amount | kzt }}</span>
              </li>
            }
            @if (ft.lineItems.length === 0) {
              <li class="text-sm text-muted">No items assigned</li>
            }
          </ul>
          <dl class="mt-3 space-y-1 text-sm">
            <div class="flex justify-between">
              <dt class="text-muted">Subtotal</dt>
              <dd class="font-tabular font-medium text-text" data-testid="subtotal">
                {{ ft.subtotal | kzt }}
              </dd>
            </div>
            @if (store.serviceCharge().present && ft.serviceCharge > 0) {
              <div class="flex justify-between">
                <dt class="text-muted">Service charge</dt>
                <dd class="font-tabular text-text" data-testid="service-charge">
                  {{ ft.serviceCharge | kzt }}
                </dd>
              </div>
            }
            <div class="flex justify-between border-t border-border pt-2 text-base">
              <dt class="font-bold text-text">Final total</dt>
              <dd class="font-tabular text-xl font-bold text-accent" data-testid="final-total">
                {{ ft.total | kzt }}
              </dd>
            </div>
          </dl>
        </article>
      }

      <button
        type="button"
        class="flex min-h-12 w-full items-center justify-center gap-2 rounded-2xl bg-accent text-base font-semibold text-white shadow-lg transition active:scale-[0.98]"
        (click)="share()"
        data-testid="share-summary-btn"
      >
        <span aria-hidden="true">↗</span>
        Share summary
      </button>
      @if (shareMessage()) {
        <p class="text-center text-sm text-success">{{ shareMessage() }}</p>
      }
    </section>
  `,
})
export class StepSummaryComponent {
  readonly store = inject(ReceiptFlowStore);
  private readonly shareService = inject(ShareService);
  readonly shareMessage = signal<string | null>(null);

  async share(): Promise<void> {
    const text = this.store.buildShareText();
    const ok = await this.shareService.shareSummary(text);
    this.shareMessage.set(ok ? 'Copied or shared!' : 'Could not share on this device');
  }
}
