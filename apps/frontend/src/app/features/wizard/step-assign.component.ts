import {
  Component,
  ElementRef,
  afterRenderEffect,
  inject,
  signal,
  viewChildren,
} from '@angular/core';
import { FormsModule } from '@angular/forms';
import { assignmentSummaryLabel } from '@dutchy/shared';
import { ReceiptFlowStore } from '../../core/receipt-flow.store';
import { KztPipe } from '../../core/kzt.pipe';
import { TranslatePipe } from '../../core/i18n/translate.pipe';

@Component({
  selector: 'app-step-assign',
  imports: [FormsModule, KztPipe, TranslatePipe],
  host: { '(window:resize)': 'onResize()' },
  template: `
    <section
      class="flex w-full min-w-0 max-w-full flex-col gap-4 overflow-x-hidden"
      data-testid="step-assign"
    >
      <header class="min-w-0">
        <h1 class="text-2xl font-bold text-text">{{ 'assign.title' | t }}</h1>
        <p class="mt-1 text-sm text-muted">{{ 'assign.subtitle' | t }}</p>
      </header>

      <!-- Friend tabs: glass pill slides behind the active tab -->
      <div
        class="sticky top-0 z-10 relative flex gap-2 overflow-x-auto pb-2"
        role="tablist"
      >
        <span
          class="glass-accent-flat pointer-events-none absolute z-0 rounded-full transition-all duration-300 ease-out"
          [style.left.px]="tabLens().left"
          [style.top.px]="tabLens().top"
          [style.width.px]="tabLens().width"
          [style.height.px]="tabLens().height"
        ></span>
        @for (friend of store.friends(); track friend.id) {
          <button
            #tabBtn
            type="button"
            role="tab"
            [attr.aria-selected]="store.activeFriendId() === friend.id"
            class="relative z-10 shrink-0 rounded-full px-4 py-2.5 text-sm font-semibold transition min-h-11"
            [class]="
              store.activeFriendId() === friend.id
                ? 'text-white'
                : 'glass-pill text-text'
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
            class="glass w-full min-w-0 rounded-2xl p-4 box-border"
            [attr.data-testid]="'assign-item-' + item.id"
          >
            <div class="flex items-start justify-between gap-2">
              <div class="min-w-0 flex-1">
                <p class="font-semibold text-text">{{ item.name }}</p>
                <p
                  class="font-tabular mt-0.5 text-sm text-muted"
                  [attr.data-testid]="'item-pcs-' + item.id"
                >
                  {{
                    'assign.itemMeta'
                      | t: { qty: item.quantity, price: (item.price | kzt) }
                  }}
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
              {{ 'assign.leftToAssign' | t }}
              <span class="font-tabular font-semibold text-text">{{ remaining }}</span>
            </p>

            @if (activeId) {
              <div class="mt-3 flex items-center gap-2">
                <button
                  type="button"
                  class="glass-pill flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold disabled:opacity-40"
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
                  class="font-tabular h-11 w-16 rounded-xl border border-border bg-surface-elevated/50 text-center text-text"
                  [ngModel]="activeQty"
                  (ngModelChange)="store.setFriendQuantity(item.id, activeId, +$event)"
                  [attr.data-testid]="'qty-input-' + item.id"
                />
                <button
                  type="button"
                  class="glass-pill flex h-11 w-11 items-center justify-center rounded-xl text-lg font-bold disabled:opacity-40"
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
                      class="glass-pill rounded-full px-2 py-0.5 text-xs font-medium text-text"
                      >{{
                        'assign.friendQty'
                          | t
                            : {
                                name: f.name,
                                qty: store.qtyForFriend(item.id, fid),
                              }
                      }}</span
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

  private readonly tabBtns =
    viewChildren<ElementRef<HTMLButtonElement>>('tabBtn');
  private readonly resizeTick = signal(0);

  /** Pixel geometry of the active tab — drives the sliding glass pill behind it. */
  readonly tabLens = signal<{
    left: number;
    top: number;
    width: number;
    height: number;
  }>({ left: 0, top: 0, width: 72, height: 44 });

  constructor() {
    // Re-measure the active tab after every relevant render and reposition the pill.
    afterRenderEffect(() => {
      this.resizeTick();
      const activeId = this.store.activeFriendId();
      const friends = this.store.friends();
      const btns = this.tabBtns();
      if (!activeId) return;
      const idx = friends.findIndex((f) => f.id === activeId);
      const el = btns[idx]?.nativeElement;
      if (!el) return;
      this.tabLens.set({
        left: el.offsetLeft,
        top: el.offsetTop,
        width: el.offsetWidth,
        height: el.offsetHeight,
      });
    });
  }

  onResize(): void {
    this.resizeTick.update((n) => n + 1);
  }

  friendById(id: string) {
    return this.store.friends().find((f) => f.id === id);
  }
}
