import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fixtureImage = path.join(__dirname, '../fixtures/receipt.png');

const MOCK_ITEM_IDS = ['item_1', 'item_2', 'item_3', 'item_4'];

const MOCK_PARSE_RESPONSE = {
  currency: 'KZT',
  items: [
    { id: 'item_1', name: 'Margherita Pizza', quantity: 1, price: 1000 },
    { id: 'item_2', name: 'Caesar Salad', quantity: 2, price: 500 },
    { id: 'item_3', name: 'Sparkling Water', quantity: 1, price: 500 },
    { id: 'item_4', name: 'Tiramisu', quantity: 1, price: 500 },
  ],
  receiptTotal: 3300,
  serviceCharge: { present: true, percent: 10, amount: 300 },
};

async function setupFriendsAndParse(page: import('@playwright/test').Page) {
  await page.getByTestId('friend-name-input').fill('Alex');
  await page.getByTestId('add-friend-btn').click();
  await page.getByTestId('upload-receipt').locator('input[type="file"]').setInputFiles(fixtureImage);
  await page.getByTestId('btn-next').click();
  await expect(page.getByTestId('receipt-item').first()).toBeVisible({ timeout: 15_000 });
  await expect(page.getByTestId('totals-match')).toBeVisible({ timeout: 5_000 });
}

async function goToAssignStep(page: import('@playwright/test').Page) {
  await setupFriendsAndParse(page);
  await page.getByTestId('btn-next').click();
  await expect(page.getByTestId('step-assign')).toBeVisible();
}

/** Assign all pieces of each item to Alex (via + buttons — reliable with Angular ngModel). */
async function assignAllPiecesToAlex(page: import('@playwright/test').Page) {
  await page.getByTestId('friend-tab-Alex').click();
  for (const id of MOCK_ITEM_IDS) {
    const row = page.getByTestId(`assign-item-${id}`);
    await row.scrollIntoViewIfNeeded();
    const qtyText = await row.getByTestId(`item-pcs-${id}`).textContent();
    const match = qtyText?.match(/^(\d+)\s*pcs/);
    const totalQty = match ? Number(match[1]) : 1;
    const plus = row.getByTestId(`qty-plus-${id}`);
    while (await plus.isEnabled()) {
      await plus.click();
    }
  }
}

test.describe('Receipt Splitter wizard', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/');
  });

  test('step 1: add friends and upload receipt', async ({ page }) => {
    await expect(page.getByTestId('step-setup')).toBeVisible();
    await page.getByTestId('friend-name-input').fill('Alex');
    await page.getByTestId('add-friend-btn').click();
    await page.getByTestId('friend-name-input').fill('Sam');
    await page.getByTestId('add-friend-btn').click();
    await expect(page.getByTestId('friend-chip')).toHaveCount(2);

    await page.getByTestId('upload-receipt').locator('input[type="file"]').setInputFiles(fixtureImage);
    await expect(page.getByTestId('btn-next')).toBeEnabled();
  });

  test('step 2: mock parse and edit price', async ({ page }) => {
    await page.getByTestId('friend-name-input').fill('Alex');
    await page.getByTestId('add-friend-btn').click();
    await page.getByTestId('upload-receipt').locator('input[type="file"]').setInputFiles(fixtureImage);
    await page.getByTestId('btn-next').click();

    await expect(page.getByTestId('step-review')).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('receipt-item').first()).toBeVisible({ timeout: 15_000 });
    await expect(page.getByTestId('totals-match')).toBeVisible();

    const priceInput = page.getByTestId('item-price').first();
    await priceInput.fill('1100');
    await page.getByTestId('receipt-total-input').fill('3400');
    await expect(page.getByTestId('totals-match')).toBeVisible();
    await page.getByTestId('btn-next').click();
    await expect(page.getByTestId('step-assign')).toBeVisible();
  });

  test('step 3: assign quantities and show progress chip', async ({ page }) => {
    await page.getByTestId('friend-name-input').fill('Alex');
    await page.getByTestId('add-friend-btn').click();
    await page.getByTestId('friend-name-input').fill('Sam');
    await page.getByTestId('add-friend-btn').click();
    await page.getByTestId('upload-receipt').locator('input[type="file"]').setInputFiles(fixtureImage);
    await page.getByTestId('btn-next').click();
    await expect(page.getByTestId('receipt-item').first()).toBeVisible({ timeout: 15_000 });
    await page.getByTestId('btn-next').click();

    await page.getByTestId('friend-tab-Alex').click();
    await page.getByTestId('qty-plus-item_2').click();
    await page.getByTestId('friend-tab-Sam').click();
    await page.getByTestId('qty-plus-item_2').click();
    await expect(page.getByTestId('assign-item-item_2').getByTestId('share-chip')).toContainText('2/2');

    await assignAllPiecesToAlex(page);
    await page.getByTestId('btn-next').click();
    await expect(page.getByTestId('step-summary')).toBeVisible();
  });

  test('step 4: totals include service charge when on receipt', async ({ page }) => {
    await goToAssignStep(page);
    await assignAllPiecesToAlex(page);
    await expect(page.getByTestId('btn-next')).toBeEnabled();
    await page.getByTestId('btn-next').click();

    const subtotalText = await page.getByTestId('subtotal').first().textContent();
    const serviceText = await page.getByTestId('service-charge').first().textContent();
    const totalText = await page.getByTestId('final-total').first().textContent();

    const parseKzt = (s: string | null) =>
      Number((s ?? '0').replace(/[^\d]/g, '')) || 0;

    const sub = parseKzt(subtotalText);
    const svc = parseKzt(serviceText);
    const tot = parseKzt(totalText);
    expect(svc).toBeGreaterThan(0);
    expect(tot).toBe(sub + svc);
  });

  test('share summary button is visible', async ({ page }) => {
    await goToAssignStep(page);
    await assignAllPiecesToAlex(page);
    await page.getByTestId('btn-next').click();
    await expect(page.getByTestId('share-summary-btn')).toBeVisible();
  });
});
