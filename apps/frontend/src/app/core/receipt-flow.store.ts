import { HttpErrorResponse } from '@angular/common/http';
import { Injectable, computed, inject, signal } from '@angular/core';
import {
  type AssignmentState,
  type Friend,
  type FriendTotal,
  type ParseReceiptResponse,
  type ReceiptItem,
  type ReceiptServiceCharge,
  allItemsFullyAssigned,
  assignedQuantity,
  computeFriendTotals,
  computeItemsSubtotal,
  expectedItemsSubtotal,
  formatKzt,
  remainingQuantity,
  resolveServiceChargeAmount,
  totalsMatch,
} from '@dutchy/shared';
import { ReceiptApiService } from './receipt-api.service';
import { ImageCompressionService } from './image-compression.service';
import { LocaleService } from './i18n/locale.service';

export type WizardStep = 1 | 2 | 3 | 4;

const DEFAULT_SERVICE: ReceiptServiceCharge = { present: false };

@Injectable({ providedIn: 'root' })
export class ReceiptFlowStore {
  private readonly api = inject(ReceiptApiService);
  private readonly compression = inject(ImageCompressionService);
  private readonly i18n = inject(LocaleService);

  readonly step = signal<WizardStep>(1);
  readonly friends = signal<Friend[]>([]);
  readonly receiptFile = signal<File | null>(null);
  readonly receiptPreviewUrl = signal<string | null>(null);
  readonly items = signal<ReceiptItem[]>([]);
  readonly assignments = signal<AssignmentState>({});
  readonly receiptTotal = signal(0);
  readonly serviceCharge = signal<ReceiptServiceCharge>(DEFAULT_SERVICE);
  readonly isParsing = signal(false);
  readonly parseError = signal<string | null>(null);
  readonly activeFriendId = signal<string | null>(null);
  readonly darkMode = signal(false);

  readonly itemsSubtotal = computed(() => computeItemsSubtotal(this.items()));

  readonly expectedSubtotal = computed(() =>
    expectedItemsSubtotal(
      this.receiptTotal(),
      this.serviceCharge(),
      this.itemsSubtotal(),
    ),
  );

  readonly serviceChargeAmount = computed(() =>
    resolveServiceChargeAmount(this.serviceCharge(), this.itemsSubtotal()),
  );

  readonly totalsAligned = computed(() =>
    totalsMatch(this.items(), this.receiptTotal(), this.serviceCharge()),
  );

  readonly grandTotalPreview = computed(() =>
    grandTotalWithService(this.itemsSubtotal(), this.serviceCharge()),
  );

  /** Parsed total likely equals "Всего" while service is separate — offer one-tap fix. */
  readonly suggestsSubtotalOnlyTotal = computed(() =>
    receiptTotalLooksLikeSubtotalOnly(
      this.receiptTotal(),
      this.itemsSubtotal(),
      this.serviceCharge(),
    ),
  );

  readonly friendTotals = computed<FriendTotal[]>(() =>
    computeFriendTotals(
      this.items(),
      this.friends(),
      this.assignments(),
      this.serviceCharge(),
    ),
  );

  readonly canProceed = computed(() => {
    switch (this.step()) {
      case 1:
        return this.receiptFile() !== null && this.friends().length >= 1;
      case 2:
        return (
          this.items().length > 0 &&
          !this.isParsing() &&
          this.totalsAligned()
        );
      case 3:
        return allItemsFullyAssigned(this.items(), this.assignments());
      case 4:
        return true;
      default:
        return false;
    }
  });

  formatKzt = formatKzt;

  lineTotal(item: ReceiptItem): number {
    return item.quantity * item.price;
  }

  remainingForItem(itemId: string): number {
    const item = this.items().find((i) => i.id === itemId);
    if (!item) return 0;
    return remainingQuantity(this.assignments(), item);
  }

  qtyForFriend(itemId: string, friendId: string): number {
    return assignedQuantity(this.assignments(), itemId, friendId);
  }

  toggleDarkMode(): void {
    this.darkMode.update((v) => !v);
  }

  addFriend(name: string): void {
    const trimmed = name.trim();
    if (!trimmed) return;
    const friend: Friend = {
      id: `friend_${crypto.randomUUID().slice(0, 8)}`,
      name: trimmed,
    };
    this.friends.update((list) => [...list, friend]);
    if (!this.activeFriendId()) {
      this.activeFriendId.set(friend.id);
    }
  }

  removeFriend(id: string): void {
    this.friends.update((list) => list.filter((f) => f.id !== id));
    this.assignments.update((all) => {
      const next: AssignmentState = {};
      for (const [itemId, shares] of Object.entries(all)) {
        const filtered = Object.fromEntries(
          Object.entries(shares).filter(([fid]) => fid !== id),
        );
        if (Object.keys(filtered).length > 0) {
          next[itemId] = filtered;
        }
      }
      return next;
    });
    if (this.activeFriendId() === id) {
      const remaining = this.friends();
      this.activeFriendId.set(remaining[0]?.id ?? null);
    }
  }

  async setReceiptFile(file: File | null): Promise<void> {
    const prev = this.receiptPreviewUrl();
    if (prev) URL.revokeObjectURL(prev);

    if (!file) {
      this.receiptFile.set(null);
      this.receiptPreviewUrl.set(null);
      return;
    }

    const compressed = await this.compression.compress(file);
    this.receiptFile.set(compressed);
    this.receiptPreviewUrl.set(URL.createObjectURL(compressed));
  }

  applyParseResult(result: ParseReceiptResponse): void {
    const items = Array.isArray(result?.items)
      ? result.items.filter(
          (item) =>
            item &&
            typeof item.name === 'string' &&
            item.name.trim().length > 0,
        )
      : [];

    if (items.length === 0) {
      this.parseError.set(this.i18n.t('parse.noItems'));
      this.items.set([]);
      this.receiptTotal.set(0);
      this.serviceCharge.set(DEFAULT_SERVICE);
      this.assignments.set({});
      return;
    }

    this.parseError.set(null);
    this.items.set(items);
    const serviceCharge = result.serviceCharge ?? DEFAULT_SERVICE;
    const { receiptTotal } = normalizeParsedTotals(
      items,
      Math.round(result.receiptTotal ?? 0),
      serviceCharge,
    );
    this.receiptTotal.set(receiptTotal);
    this.serviceCharge.set(serviceCharge);
    this.assignments.set({});
  }

  setServiceChargePresent(present: boolean): void {
    if (!present) {
      this.serviceCharge.set({ present: false });
      return;
    }
    const current = this.serviceCharge();
    this.serviceCharge.set({
      present: true,
      percent: current.percent ?? 10,
      amount: current.amount,
    });
  }

  setServicePercent(percent: number): void {
    const p = Math.max(0, Math.min(100, Math.round(percent)));
    this.serviceCharge.set({
      present: true,
      percent: p,
      amount: undefined,
    });
  }

  setServiceAmount(amount: number): void {
    this.serviceCharge.set({
      present: true,
      percent: this.serviceCharge().percent,
      amount: Math.max(0, Math.round(amount)),
    });
  }

  /** Set receipt total to items subtotal + service (Итого к оплате). */
  applyGrandTotalWithService(): void {
    this.receiptTotal.set(
      grandTotalWithService(this.itemsSubtotal(), this.serviceCharge()),
    );
  }

  async parseReceipt(): Promise<void> {
    const file = this.receiptFile();
    if (!file) return;

    this.isParsing.set(true);
    this.parseError.set(null);
    this.step.set(2);

    try {
      const result = await this.api.parseReceipt(file);
      this.applyParseResult(result);
    } catch (err) {
      console.error('[ReceiptFlow] parse failed', err);
      this.parseError.set(this.formatParseError(err));
      this.items.set([]);
      this.receiptTotal.set(0);
      this.serviceCharge.set(DEFAULT_SERVICE);
    } finally {
      this.isParsing.set(false);
    }
  }

  setReceiptTotal(value: number): void {
    this.receiptTotal.set(Math.max(0, Math.round(value)));
  }

  updateItem(id: string, patch: Partial<ReceiptItem>): void {
    this.items.update((list) =>
      list.map((item) => (item.id === id ? { ...item, ...patch } : item)),
    );
  }

  addItem(): void {
    const n = this.items().length + 1;
    const item: ReceiptItem = {
      id: `item_${n}`,
      name: this.i18n.t('review.newItem'),
      quantity: 1,
      price: 0,
    };
    this.items.update((list) => [...list, item]);
  }

  removeItem(id: string): void {
    this.items.update((list) => list.filter((i) => i.id !== id));
    this.assignments.update((all) => {
      const next = { ...all };
      delete next[id];
      return next;
    });
  }

  setActiveFriend(id: string): void {
    this.activeFriendId.set(id);
  }

  /**
   * Set exact piece count for a friend on an item (0 removes assignment).
   */
  setFriendQuantity(itemId: string, friendId: string, quantity: number): void {
    const item = this.items().find((i) => i.id === itemId);
    if (!item) return;

    const qty = Math.max(0, Math.min(Math.floor(quantity), item.quantity));
    const others = totalAssignedExcept(this.assignments(), itemId, friendId);
    const maxForFriend = Math.max(0, item.quantity - others);
    const clamped = Math.min(qty, maxForFriend);

    this.assignments.update((all) => {
      const next = { ...all };
      const shares = { ...(next[itemId] ?? {}) };

      if (clamped <= 0) {
        delete shares[friendId];
      } else {
        shares[friendId] = clamped;
      }

      if (Object.keys(shares).length === 0) {
        delete next[itemId];
      } else {
        next[itemId] = shares;
      }
      return next;
    });
  }

  adjustFriendQuantity(itemId: string, friendId: string, delta: number): void {
    const current = this.qtyForFriend(itemId, friendId);
    this.setFriendQuantity(itemId, friendId, current + delta);
  }

  assigneesForItem(itemId: string): string[] {
    const shares = this.assignments()[itemId];
    if (!shares) return [];
    return Object.keys(shares).filter((id) => (shares[id] ?? 0) > 0);
  }

  nextStep(): void {
    const s = this.step();
    if (s < 4) this.step.set((s + 1) as WizardStep);
  }

  prevStep(): void {
    const s = this.step();
    if (s > 1) this.step.set((s - 1) as WizardStep);
  }

  goToStep(step: WizardStep): void {
    this.step.set(step);
  }

  buildShareText(): string {
    const sc = this.serviceCharge();
    return this.friendTotals()
      .map((ft) => {
        const lines = ft.lineItems.map((li) =>
          this.i18n.t('share.line', {
            name: li.name,
            qty: li.quantity,
            amount: formatKzt(li.amount),
          }),
        );
        const parts = [
          `${ft.friendName}`,
          ...lines,
          this.i18n.t('share.subtotal', { amount: formatKzt(ft.subtotal) }),
        ];
        if (sc.present && ft.serviceCharge > 0) {
          parts.push(
            this.i18n.t('share.service', {
              amount: formatKzt(ft.serviceCharge),
            }),
          );
        }
        parts.push(
          this.i18n.t('share.total', { amount: formatKzt(ft.total) }),
        );
        return parts.join('\n');
      })
      .join('\n\n');
  }

  private formatParseError(err: unknown): string {
    if (err instanceof HttpErrorResponse) {
      if (err.status === 0) {
        return this.i18n.t('parse.network');
      }
      const body = err.error;
      let detail: string | null = null;
      if (typeof body === 'string' && body.trim()) {
        detail = body.trim();
      } else if (body && typeof body === 'object') {
        const msg = (body as { message?: unknown }).message;
        if (Array.isArray(msg)) {
          detail = msg.map(String).join(', ');
        } else if (typeof msg === 'string') {
          detail = msg;
        }
      }
      if (detail) {
        return this.i18n.t('parse.withStatus', {
          status: err.status,
          detail,
        });
      }
      return this.i18n.t('parse.http', { status: err.status });
    }
    if (err instanceof Error && err.message) {
      return err.message;
    }
    return this.i18n.t('parse.generic');
  }

  reset(): void {
    const url = this.receiptPreviewUrl();
    if (url) URL.revokeObjectURL(url);
    this.step.set(1);
    this.friends.set([]);
    this.receiptFile.set(null);
    this.receiptPreviewUrl.set(null);
    this.items.set([]);
    this.assignments.set({});
    this.receiptTotal.set(0);
    this.serviceCharge.set(DEFAULT_SERVICE);
    this.isParsing.set(false);
    this.parseError.set(null);
    this.activeFriendId.set(null);
  }
}

/** Local helpers — kept in frontend so Vite does not serve a stale prebundle of @dutchy/shared. */
function receiptTotalLooksLikeSubtotalOnly(
  receiptTotal: number,
  itemsSubtotal: number,
  serviceCharge: ReceiptServiceCharge,
  tolerance = 1,
): boolean {
  if (!serviceCharge.present) return false;
  const service = resolveServiceChargeAmount(serviceCharge, itemsSubtotal);
  if (service <= 0) return false;
  return Math.abs(receiptTotal - itemsSubtotal) <= tolerance;
}

function grandTotalWithService(
  itemsSubtotal: number,
  serviceCharge: ReceiptServiceCharge,
): number {
  return Math.round(
    itemsSubtotal + resolveServiceChargeAmount(serviceCharge, itemsSubtotal),
  );
}

function normalizeParsedTotals(
  items: ReceiptItem[],
  receiptTotal: number,
  serviceCharge: ReceiptServiceCharge,
): { receiptTotal: number; serviceCharge: ReceiptServiceCharge } {
  const sub = computeItemsSubtotal(items);
  if (receiptTotalLooksLikeSubtotalOnly(receiptTotal, sub, serviceCharge)) {
    return {
      receiptTotal: grandTotalWithService(sub, serviceCharge),
      serviceCharge,
    };
  }
  return { receiptTotal, serviceCharge };
}

function totalAssignedExcept(
  assignments: AssignmentState,
  itemId: string,
  excludeFriendId: string,
): number {
  const shares = assignments[itemId];
  if (!shares) return 0;
  return Object.entries(shares).reduce(
    (sum, [fid, q]) => (fid === excludeFriendId ? sum : sum + (q > 0 ? q : 0)),
    0,
  );
}
