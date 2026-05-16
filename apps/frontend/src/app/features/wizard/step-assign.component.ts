import { Component, inject } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { assignmentSummaryLabel } from '@dutchy/shared';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';
import { KztPipe } from '../../core/kzt.pipe';

@Component({
  selector: 'app-step-assign',
  imports: [FormsModule, KztPipe],
  template: `
    <section
      class="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden"
      data-testid="step-assign"
    >
      <header class="min-w-0">
        <h1 class="text-2xl font-bold text-text">Assign dishes</h1>
        <p class="mt-1 text-sm text-muted">
          Set how many pieces each friend ordered. All pieces must be assigned.
        </p>
      </header>

      <div class="sticky top-0 z-10 flex gap-2 overflow-x-auto pb-2" role="tablist">
        @for (friend of store.friends(); track friend.id) {
          <button
            type="button"
            role="tab"
            [attr.aria-selected]="store.activeFriendId() === friend.id"
            class="shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition min-h-11"
            [class]="
              store.activeFriendId() === friend.id
                ? 'bg-accent text-white shadow-md'
                : 'bg-surface-elevated text-text ring-1 ring-border'
            "
            (click)="store.setActiveFriend(friend.id)"
            [attr.data-testid]="'friend-tab-' + friend.name"
          >
            {{ friend.name }}
          </button>
        }
      </div>

      <ul class="flex flex-col gap-3 pb-4">
        @for (item of store.items(); track item.id) {
          @let remaining = store.remainingForItem(item.id);
          @let summary = this.assignmentSummaryLabel(store.assignments(), item);
          @let activeId = store.activeFriendId();
          @let activeQty = activeId ? store.qtyForFriend(item.id, activeId) : 0;
          <li
            class="w-full min-w-0 rounded-2xl border border-border bg-surface-elevated p-4 box-border"
            [attr.data-testid]="'assign-item-' + item.id"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-text">{{ item.name }}</p>
                <p
                  class="font-tabular mt-0.5 text-sm text-muted"
                  [attr.data-testid]="'item-pcs-' + item.id"
                >
                  {{ item.quantity }} pcs × {{ item.price | kzt }}
                </p>
              </div>
              <div class="flex shrink-0 flex-col items-end gap-1">
                @if (summary) {
                  <span
                    class="rounded-full bg-accent px-2 py-0.5 text-xs font-bold text-white"
                    data-testid="share-chip"
                    >{{ summary }}</span
                  >
                }
                <span class="font-tabular text-sm font-semibold text-text">
                  {{ store.lineTotal(item) | kzt }}
                </span>
              </div>
            </div>

            <p class="mt-2 text-xs text-muted">
              Left to assign:
              <span class="font-tabular font-semibold text-text">{{ remaining }}</span>
            </p>

            @if (activeId) {
              <div class="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-lg font-bold"
                  [disabled]="activeQty <= 0"
                  (click)="store.adjustFriendQuantity(item.id, activeId, -1)"
                  [attr.data-testid]="'qty-minus-' + item.id"
                >
                  −
                </button>
                <input
                  type="number"
                  min="0"
                  [max]="item.quantity"
                  class="font-tabular h-11 w-16 rounded-xl border border-border bg-surface text-center text-text"
                  [ngModel]="activeQty"
                  (ngModelChange)="store.setFriendQuantity(item.id, activeId, +$event)"
                  [attr.data-testid]="'qty-input-' + item.id"
                />
                <button
                  type="button"
                  class="flex h-11 w-11 items-center justify-center rounded-xl border border-border bg-surface text-lg font-bold"
                  [disabled]="remaining <= 0"
                  (click)="store.adjustFriendQuantity(item.id, activeId, 1)"
                  [attr.data-testid]="'qty-plus-' + item.id"
                >
                  +
                </button>
              </div>
            }

            @if (store.assigneesForItem(item.id).length) {
              <div class="mt-3 flex flex-wrap gap-1">
                @for (fid of store.assigneesForItem(item.id); track fid) {
                  @let f = friendById(fid);
                  @if (f) {
                    <span
                      class="rounded-full bg-accent-soft px-2 py-0.5 text-xs font-medium text-text"
                      >{{ f.name }}: {{ store.qtyForFriend(item.id, fid) }}</span
                    >
                  }
                }
              </div>
            }
          </li>
        }
      </ul>
    </section>
  `,
})
export class StepAssignComponent {
  readonly store = inject(ReceiptFlowStore);
  readonly assignmentSummaryLabel = assignmentSummaryLabel;

  friendById(id: string) {
    return this.store.friends().find((f) => f.id === id);
  }
}
