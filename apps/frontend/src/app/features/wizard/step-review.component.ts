import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';
import { KztPipe } from '../../core/kzt.pipe';
import { TranslatePipe } from '../../core/i18n/translate.pipe';
import {
  formatNumericInput,
  parseNumericInput,
} from '../../core/numeric-field.util';

@Component({
  selector: 'app-step-review',
  imports: [FormsModule, KztPipe, TranslatePipe],
  template: `
    @let servicePercents = [5, 10, 15];
    <section
      class="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden"
      data-testid="step-review"
    >
      <header class="min-w-0">
        <h1 class="text-2xl font-bold text-text">{{ 'review.title' | t }}</h1>
        <p class="mt-1 text-sm text-muted">{{ 'review.subtitle' | t }}</p>
      </header>

      @if (store.isParsing()) {
        <div
          class="glass flex flex-col items-center gap-4 rounded-3xl p-8"
          data-testid="parsing-loader"
        >
          <div
            class="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent"
            aria-hidden="true"
          ></div>
          <p class="text-sm font-medium text-muted">{{ 'review.parsing' | t }}</p>
          <div class="w-full space-y-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="h-14 animate-pulse rounded-2xl bg-border/60"></div>
            }
          </div>
        </div>
      } @else {
        @if (store.parseError(); as err) {
          <div
            class="glass rounded-2xl border-2 border-accent px-4 py-4"
            role="alert"
            data-testid="parse-error"
          >
            <p class="text-sm font-semibold text-text">{{ err }}</p>
            @if (store.items().length === 0) {
              <p class="mt-2 text-xs text-muted">
                {{
                  'review.parseErrorManual'
                    | t: { addItem: ('review.addItemBtn' | t) }
                }}
              </p>
            }
          </div>
        }

        <div
          class="glass w-full min-w-0 rounded-2xl border p-4 box-border"
          [class]="
            store.totalsAligned()
              ? 'border-success/50 bg-success/10'
              : 'border-accent/60 bg-accent-soft/30'
          "
          data-testid="totals-panel"
        >
          <div class="grid w-full min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <label class="flex min-w-0 flex-col gap-1">
              <span class="text-muted">{{ 'review.totalToPay' | t }}</span>
              <input
                type="text"
                inputmode="numeric"
                class="font-tabular min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface-elevated/60 px-3 text-text box-border"
                [ngModel]="displayTotal()"
                (ngModelChange)="onTotalInput($event)"
                (blur)="onTotalBlur()"
                data-testid="receipt-total-input"
              />
            </label>
            <div class="flex min-w-0 flex-col justify-end gap-1">
              <span class="text-muted">{{ 'review.itemsSubtotal' | t }}</span>
              <span class="font-tabular text-lg font-semibold text-text" data-testid="items-subtotal">
                {{ store.itemsSubtotal() | kzt }}
              </span>
            </div>
          </div>

          <div
            class="mt-3 rounded-xl border border-border bg-surface/50 p-3"
            data-testid="service-charge-panel"
          >
            <label class="flex cursor-pointer items-center gap-2 text-sm font-medium text-text">
              <input
                type="checkbox"
                class="h-4 w-4 rounded border-border accent-accent"
                [ngModel]="store.serviceCharge().present"
                (ngModelChange)="store.setServiceChargePresent($event)"
                data-testid="service-charge-toggle"
              />
              {{ 'review.serviceCharge' | t }}
            </label>

            @if (store.serviceCharge().present) {
              <div class="mt-3 flex flex-wrap gap-2">
                @for (p of servicePercents; track p) {
                  <button
                    type="button"
                    class="min-h-9 rounded-full px-3 text-sm font-semibold transition"
                    [class]="
                      store.serviceCharge().percent === p
                        ? 'glass-accent text-white'
                        : 'glass-pill text-text'
                    "
                    (click)="store.setServicePercent(p)"
                    [attr.data-testid]="'service-percent-' + p"
                  >
                    {{ p }}%
                  </button>
                }
              </div>
              <p class="mt-2 text-xs text-muted">
                {{
                  'review.serviceLine'
                    | t
                      : {
                          service: (store.serviceChargeAmount() | kzt),
                          total: (store.grandTotalPreview() | kzt),
                        }
                }}
              </p>
              @if (store.suggestsSubtotalOnlyTotal()) {
                <button
                  type="button"
                  class="glass-accent mt-2 min-h-10 w-full rounded-xl px-3 text-sm font-semibold text-white"
                  (click)="store.applyGrandTotalWithService()"
                  data-testid="apply-grand-total-btn"
                >
                  {{
                    'review.useTotalWithService'
                      | t: { total: (store.grandTotalPreview() | kzt) }
                  }}
                </button>
              }
            }
          </div>

          @if (!store.totalsAligned()) {
            <p class="mt-2 text-sm font-medium text-accent" data-testid="totals-mismatch">
              @if (store.serviceCharge().present && store.suggestsSubtotalOnlyTotal()) {
                {{ 'review.totalsMismatchPreService' | t }}
              } @else {
                {{
                  'review.totalsMismatchDiff'
                    | t
                      : {
                          diff:
                            (store.itemsSubtotal() - store.expectedSubtotal() | kzt),
                        }
                }}
              }
            </p>
          } @else {
            <p class="mt-2 text-sm text-success" data-testid="totals-match">
              {{ 'review.totalsMatch' | t }}
            </p>
          }
        </div>

        <ul class="flex w-full min-w-0 flex-col gap-3">
          @for (item of store.items(); track item.id) {
            <li
              class="glass w-full min-w-0 rounded-2xl p-3 box-border sm:p-4"
              data-testid="receipt-item"
            >
              <input
                class="mb-3 w-full min-w-0 box-border border-0 bg-transparent text-base font-semibold text-text outline-none"
                [ngModel]="item.name"
                (ngModelChange)="store.updateItem(item.id, { name: $event })"
                data-testid="item-name"
              />
              <div class="grid w-full min-w-0 grid-cols-2 gap-2 sm:grid-cols-[1fr_1fr_auto]">
                <label class="flex min-w-0 flex-col gap-1 text-xs text-muted">
                  {{ 'review.qty' | t }}
                  <input
                    type="text"
                    inputmode="numeric"
                    class="font-tabular min-h-10 w-full min-w-0 rounded-xl border border-border bg-surface-elevated/50 px-2 text-text box-border"
                    [ngModel]="displayQty(item.id, item.quantity)"
                    (ngModelChange)="onQtyInput(item.id, $event)"
                    (blur)="onQtyBlur(item.id)"
                    data-testid="item-qty"
                  />
                </label>
                <label class="flex min-w-0 flex-col gap-1 text-xs text-muted">
                  {{ 'review.unitPrice' | t }}
                  <input
                    type="text"
                    inputmode="numeric"
                    class="font-tabular min-h-10 w-full min-w-0 rounded-xl border border-border bg-surface-elevated/50 px-2 text-text box-border"
                    [ngModel]="displayPrice(item.id, item.price)"
                    (ngModelChange)="onPriceInput(item.id, $event)"
                    (blur)="onPriceBlur(item.id)"
                    data-testid="item-price"
                  />
                </label>
                <button
                  type="button"
                  class="col-span-2 min-h-10 self-end text-xs text-muted underline sm:col-span-1"
                  (click)="store.removeItem(item.id)"
                >
                  {{ 'review.remove' | t }}
                </button>
              </div>
              <p class="font-tabular mt-2 text-right text-sm text-muted">
                {{ 'review.line' | t: { amount: (store.lineTotal(item) | kzt) } }}
              </p>
            </li>
          }
        </ul>

        <button
          type="button"
          class="min-h-11 w-full rounded-2xl border border-dashed border-border text-sm font-medium text-muted"
          (click)="store.addItem()"
          data-testid="add-item-btn"
        >
          {{ 'review.addItemBtn' | t }}
        </button>
      }
    </section>
  `,
})
export class StepReviewComponent {
  readonly store = inject(ReceiptFlowStore);
  private readonly drafts = new Map<string, string>();

  displayTotal(): string {
    return this.fieldDisplay('total', this.store.receiptTotal());
  }

  displayPrice(itemId: string, price: number): string {
    return this.fieldDisplay(`price-${itemId}`, price);
  }

  displayQty(itemId: string, qty: number): string {
    return this.fieldDisplay(`qty-${itemId}`, qty, false);
  }

  onTotalInput(raw: string | number): void {
    this.onNumericInput('total', raw, (n) => this.store.setReceiptTotal(n));
  }

  onTotalBlur(): void {
    this.onNumericBlur('total');
  }

  onPriceInput(itemId: string, raw: string | number): void {
    this.onNumericInput(`price-${itemId}`, raw, (n) =>
      this.store.updateItem(itemId, { price: n }),
    );
  }

  onPriceBlur(itemId: string): void {
    this.onNumericBlur(`price-${itemId}`);
  }

  onQtyInput(itemId: string, raw: string | number): void {
    this.onNumericInput(`qty-${itemId}`, raw, (n) => {
      const qty = Math.max(1, n);
      this.store.updateItem(itemId, { quantity: qty });
    });
  }

  onQtyBlur(itemId: string): void {
    this.onNumericBlur(`qty-${itemId}`);
  }

  private fieldDisplay(key: string, value: number, emptyWhenZero = true): string {
    if (this.drafts.has(key)) return this.drafts.get(key)!;
    return formatNumericInput(value, emptyWhenZero);
  }

  private onNumericInput(
    key: string,
    raw: string | number,
    apply: (n: number) => void,
  ): void {
    const parsed = parseNumericInput(raw);
    if (parsed === null) {
      this.drafts.set(key, '');
      return;
    }
    this.drafts.delete(key);
    apply(parsed);
  }

  private onNumericBlur(key: string): void {
    if (this.drafts.get(key) === '') {
      this.drafts.delete(key);
    }
  }
}
