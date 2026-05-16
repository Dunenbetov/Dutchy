export interface ReceiptItem {
  id: string;
  name: string;
  quantity: number;
  /** Unit price in KZT */
  price: number;
}

export interface Friend {
  id: string;
  name: string;
}

/** itemId -> friendId -> quantity (pieces) assigned to that friend */
export type AssignmentState = Record<string, Record<string, number>>;

export interface ReceiptServiceCharge {
  present: boolean;
  /** e.g. 10 for 10% */
  percent?: number;
  /** Fixed service amount in KZT when printed on receipt */
  amount?: number;
}

export interface ParseReceiptResponse {
  currency: 'KZT';
  items: ReceiptItem[];
  /** Grand total printed on the receipt (KZT) */
  receiptTotal: number;
  serviceCharge: ReceiptServiceCharge;
}

export interface FriendLineItem {
  itemId: string;
  name: string;
  quantity: number;
  unitPrice: number;
  amount: number;
}

export interface FriendTotal {
  friendId: string;
  friendName: string;
  lineItems: FriendLineItem[];
  subtotal: number;
  serviceCharge: number;
  total: number;
}

export function formatKzt(value: number): string {
  const rounded = Math.round(value);
  return `${new Intl.NumberFormat('ru-KZ', { maximumFractionDigits: 0 }).format(rounded)} ₸`;
}

export function computeItemsSubtotal(items: ReceiptItem[]): number {
  return items.reduce((sum, item) => sum + item.quantity * item.price, 0);
}

export function resolveServiceChargeAmount(
  serviceCharge: ReceiptServiceCharge,
  itemsSubtotal: number,
): number {
  if (!serviceCharge.present) return 0;
  if (serviceCharge.amount != null && serviceCharge.amount > 0) {
    return Math.round(serviceCharge.amount);
  }
  if (serviceCharge.percent != null && serviceCharge.percent > 0) {
    return Math.round((itemsSubtotal * serviceCharge.percent) / 100);
  }
  return 0;
}

/** Items subtotal implied by receipt total minus explicit service line */
export function expectedItemsSubtotal(
  receiptTotal: number,
  serviceCharge: ReceiptServiceCharge,
  itemsSubtotalFallback: number,
): number {
  const service = resolveServiceChargeAmount(serviceCharge, itemsSubtotalFallback);
  return Math.round(receiptTotal - service);
}

export function totalsMatch(
  items: ReceiptItem[],
  receiptTotal: number,
  serviceCharge: ReceiptServiceCharge,
  tolerance = 1,
): boolean {
  const computed = computeItemsSubtotal(items);
  const expected = expectedItemsSubtotal(receiptTotal, serviceCharge, computed);
  return Math.abs(computed - expected) <= tolerance;
}

/** True when receiptTotal equals items subtotal but service is also on the receipt (common LLM mistake). */
export function receiptTotalLooksLikeSubtotalOnly(
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

export function grandTotalWithService(
  itemsSubtotal: number,
  serviceCharge: ReceiptServiceCharge,
): number {
  return Math.round(
    itemsSubtotal + resolveServiceChargeAmount(serviceCharge, itemsSubtotal),
  );
}

/** Fix receiptTotal when the model used pre-service "Всего" instead of "Итого к оплате". */
export function normalizeParsedTotals(
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

export function assignedQuantity(
  assignments: AssignmentState,
  itemId: string,
  friendId: string,
): number {
  return assignments[itemId]?.[friendId] ?? 0;
}

export function totalAssignedQuantity(
  assignments: AssignmentState,
  itemId: string,
): number {
  const shares = assignments[itemId];
  if (!shares) return 0;
  return Object.values(shares).reduce((sum, q) => sum + (q > 0 ? q : 0), 0);
}

export function remainingQuantity(
  assignments: AssignmentState,
  item: ReceiptItem,
): number {
  return Math.max(0, item.quantity - totalAssignedQuantity(assignments, item.id));
}

export function allItemsFullyAssigned(
  items: ReceiptItem[],
  assignments: AssignmentState,
): boolean {
  return items.every((item) => remainingQuantity(assignments, item) === 0);
}

export function computeFriendTotals(
  items: ReceiptItem[],
  friends: Friend[],
  assignments: AssignmentState,
  serviceCharge: ReceiptServiceCharge,
): FriendTotal[] {
  const friendSubtotals = friends.map((friend) => {
    const lineItems: FriendLineItem[] = [];

    for (const item of items) {
      const qty = assignedQuantity(assignments, item.id, friend.id);
      if (qty <= 0) continue;

      lineItems.push({
        itemId: item.id,
        name: item.name,
        quantity: qty,
        unitPrice: item.price,
        amount: qty * item.price,
      });
    }

    const subtotal = lineItems.reduce((sum, li) => sum + li.amount, 0);
    return { friend, lineItems, subtotal };
  });

  const itemsSubtotal = friendSubtotals.reduce((s, f) => s + f.subtotal, 0);
  const totalService = resolveServiceChargeAmount(serviceCharge, itemsSubtotal);

  return friendSubtotals.map(({ friend, lineItems, subtotal }) => {
    const serviceShare =
      itemsSubtotal > 0 && totalService > 0
        ? Math.round((subtotal / itemsSubtotal) * totalService)
        : 0;
    return {
      friendId: friend.id,
      friendName: friend.name,
      lineItems,
      subtotal,
      serviceCharge: serviceShare,
      total: subtotal + serviceShare,
    };
  });
}

export function assignmentSummaryLabel(
  assignments: AssignmentState,
  item: ReceiptItem,
): string | null {
  const shares = assignments[item.id];
  if (!shares) return null;
  const parts = Object.entries(shares)
    .filter(([, q]) => q > 0)
    .map(([, q]) => `${q}`);
  if (parts.length === 0) return null;
  const assigned = totalAssignedQuantity(assignments, item.id);
  return `${assigned}/${item.quantity}`;
}
