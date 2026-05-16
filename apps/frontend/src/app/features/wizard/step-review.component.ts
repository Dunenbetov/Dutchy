import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';
import { KztPipe } from '../../core/kzt.pipe';

@Component({
  selector: 'app-step-review',
  imports: [FormsModule, KztPipe],
  template: `
    @let servicePercents = [5, 10, 15];
    <section
      class="flex w-full min-w-0 max-w-full flex-col gap-5 overflow-x-hidden"
      data-testid="step-review"
    >
      <header class="min-w-0">
        <h1 class="text-2xl font-bold text-text">Review items</h1>
        <p class="mt-1 text-sm text-muted">Fix names and prices until the sum matches the receipt.</p>
      </header>

      @if (store.isParsing()) {
        <div
          class="flex flex-col items-center gap-4 rounded-3xl border border-border bg-surface-elevated/80 p-8 backdrop-blur-sm"
          data-testid="parsing-loader"
        >
          <div
            class="h-10 w-10 animate-spin rounded-full border-2 border-accent border-t-transparent"
            aria-hidden="true"
          ></div>
          <p class="text-sm font-medium text-muted">Reading your receipt…</p>
          <div class="w-full space-y-3">
            @for (i of [1, 2, 3]; track i) {
              <div class="h-14 animate-pulse rounded-2xl bg-border/60"></div>
            }
          </div>
        </div>
      } @else {
        @if (store.parseError(); as err) {
          <div
            class="rounded-2xl border-2 border-accent bg-surface-elevated px-4 py-4 shadow-sm"
            role="alert"
            data-testid="parse-error"
          >
            <p class="text-sm font-semibold text-text">{{ err }}</p>
            @if (store.items().length === 0) {
              <p class="mt-2 text-xs text-muted">
                Use <span class="font-medium text-text">+ Add item</span> to enter lines manually, then set the
                total to pay.
              </p>
            }
          </div>
        }

        <div
          class="w-full min-w-0 rounded-2xl border p-4 box-border"
          [class]="
            store.totalsAligned()
              ? 'border-success/50 bg-success/10'
              : 'border-accent/60 bg-accent-soft/30'
          "
          data-testid="totals-panel"
        >
          <div class="grid w-full min-w-0 grid-cols-1 gap-3 text-sm sm:grid-cols-2">
            <label class="flex min-w-0 flex-col gap-1">
              <span class="text-muted">Total to pay — Итого (₸)</span>
              <input
                type="number"
                min="0"
                step="1"
                class="font-tabular min-h-11 w-full min-w-0 rounded-xl border border-border bg-surface-elevated px-3 text-text box-border"
                [ngModel]="store.receiptTotal()"
                (ngModelChange)="store.setReceiptTotal(+$event)"
                data-testid="receipt-total-input"
              />
            </label>
            <div class="flex min-w-0 flex-col justify-end gap-1">
              <span class="text-muted">Items subtotal (Всего)</span>
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
              Service charge on receipt
            </label>

            @if (store.serviceCharge().present) {
              <div class="mt-3 flex flex-wrap gap-2">
                @for (p of servicePercents; track p) {
                  <button
                    type="button"
                    class="min-h-9 rounded-full px-3 text-sm font-semibold transition"
                    [class]="
                      store.serviceCharge().percent === p
                        ? 'bg-accent text-white'
                        : 'bg-surface-elevated text-text ring-1 ring-border'
                    "
                    (click)="store.setServicePercent(p)"
                    [attr.data-testid]="'service-percent-' + p"
                  >
                    {{ p }}%
                  </button>
                }
              </div>
              <p class="mt-2 text-xs text-muted">
                Service: {{ store.serviceChargeAmount() | kzt }} · Total with service:
                <span class="font-tabular font-semibold text-text">{{
                  store.grandTotalPreview() | kzt
                }}</span>
              </p>
              @if (store.suggestsSubtotalOnlyTotal()) {
                <button
                  type="button"
                  class="mt-2 min-h-10 w-full rounded-xl bg-accent px-3 text-sm font-semibold text-white"
                  (click)="store.applyGrandTotalWithService()"
                  data-testid="apply-grand-total-btn"
                >
                  Use total with service ({{ store.grandTotalPreview() | kzt }})
                </button>
              }
            }
          </div>

          @if (!store.totalsAligned()) {
            <p class="mt-2 text-sm font-medium text-accent" data-testid="totals-mismatch">
              @if (store.serviceCharge().present && store.suggestsSubtotalOnlyTotal()) {
                Total looks like pre-service “Всего”. Turn on service above or tap “Use total with service”.
              } @else {
                Difference: {{ store.itemsSubtotal() - store.expectedSubtotal() | kzt }} — adjust items,
                service %, or total to pay.
              }
            </p>
          } @else {
            <p class="mt-2 text-sm text-success" data-testid="totals-match">Totals match the receipt.</p>
          }
        </div>

        <ul class="flex w-full min-w-0 flex-col gap-3">
          @for (item of store.items(); track item.id) {
            <li
              class="w-full min-w-0 rounded-2xl border border-border bg-surface-elevated p-3 shadow-sm box-border sm:p-4"
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
                  Qty
                  <input
                    type="number"
                    min="1"
                    step="1"
                    class="font-tabular min-h-10 w-full min-w-0 rounded-xl border border-border px-2 text-text box-border"
                    [ngModel]="item.quantity"
                    (ngModelChange)="store.updateItem(item.id, { quantity: +$event })"
                    data-testid="item-qty"
                  />
                </label>
                <label class="flex min-w-0 flex-col gap-1 text-xs text-muted">
                  Unit ₸
                  <input
                    type="number"
                    min="0"
                    step="1"
                    class="font-tabular min-h-10 w-full min-w-0 rounded-xl border border-border px-2 text-text box-border"
                    [ngModel]="item.price"
                    (ngModelChange)="store.updateItem(item.id, { price: +$event })"
                    data-testid="item-price"
                  />
                </label>
                <button
                  type="button"
                  class="col-span-2 min-h-10 self-end text-xs text-muted underline sm:col-span-1"
                  (click)="store.removeItem(item.id)"
                >
                  Remove
                </button>
              </div>
              <p class="font-tabular mt-2 text-right text-sm text-muted">
                Line: {{ store.lineTotal(item) | kzt }}
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
          + Add item
        </button>
      }
    </section>
  `,
})
export class StepReviewComponent {
  readonly store = inject(ReceiptFlowStore);
}
