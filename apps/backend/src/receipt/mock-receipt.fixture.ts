import type { ParseReceiptResponse } from '@receipt-splitter/shared';
import { computeItemsSubtotal } from '@receipt-splitter/shared';

const items = [
  { id: 'item_1', name: 'Margherita Pizza', quantity: 1, price: 1000 },
  { id: 'item_2', name: 'Caesar Salad', quantity: 2, price: 500 },
  { id: 'item_3', name: 'Sparkling Water', quantity: 1, price: 500 },
  { id: 'item_4', name: 'Tiramisu', quantity: 1, price: 500 },
];

const itemsSubtotal = computeItemsSubtotal(items);
const serviceAmount = Math.round(itemsSubtotal * 0.1);

export const MOCK_RECEIPT: ParseReceiptResponse = {
  currency: 'KZT',
  items,
  receiptTotal: itemsSubtotal + serviceAmount,
  serviceCharge: {
    present: true,
    percent: 10,
    amount: serviceAmount,
  },
};
