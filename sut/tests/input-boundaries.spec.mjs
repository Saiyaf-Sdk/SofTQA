import { test, expect } from '@playwright/test';
import { randomUUID } from 'node:crypto';

async function getSession(request) {
  const response = await request.get('/api/session');
  expect(response.ok()).toBeTruthy();
  const { shopper } = await response.json();
  return { 'X-Lumen-Request': '1', 'X-Lumen-Shopper': String(shopper) };
}

for (const [id, length, expected] of [
  ['BVA-07', 7, 400], ['BVA-08', 8, 201], ['BVA-09', 9, 201],
  ['BVA-127', 127, 201], ['BVA-128', 128, 201], ['BVA-129', 129, 400]
]) {
  test(id + ' registration password length ' + length, async ({ request }) => {
    const headers = await getSession(request);
    const response = await request.post('/api/auth/register', {
      headers,
      data: { username: 'qa_' + randomUUID().slice(0, 12), firstName: 'QA Tester', password: 'X'.repeat(length) }
    });
    expect(response.status()).toBe(expected);
    const body = await response.json();
    if (expected === 201) expect(body.user.firstName).toBe('QA Tester');
    else expect(body.message).toContain('password');
  });
}

for (const [id, change, expected] of [
  ['STOCK-01', -1, 200], ['STOCK-02', 0, 200], ['STOCK-03', 1, 409]
]) {
  test(id + ' bag quantity relative to current stock ' + change, async ({ request }) => {
    const headers = await getSession(request);
    const catalog = await (await request.get('/api/products')).json();
    const product = catalog.find(({ title }) => title === 'CK One');
    expect(product.stock).toBeGreaterThan(1);

    const quantity = product.stock + change;
    const response = await request.post('/api/cart', {
      headers,
      data: { productId: product.id, delta: quantity }
    });
    expect(response.status()).toBe(expected);
    const { cart } = await (await request.get('/api/session')).json();
    expect(cart.map((line) => line.quantity)).toEqual(expected === 200 ? [quantity] : []);
  });
}

test('EP-05 and EP-06 blank and unsupported vouchers leave totals unchanged', async ({ page }) => {
  await page.goto('/catalog');
  const card = page.locator('.perfume-card').filter({ hasText: 'CK One' });
  await card.hover();
  await card.getByRole('button', { name: 'Quick view' }).click();
  await page.getByRole('dialog').getByRole('button', { name: 'Add to bag' }).click();
  await page.getByRole('link', { name: 'Shopping bag, 1 items' }).click();
  const total = page.locator('.summary .total strong');
  await expect(total).toHaveText('$99.71');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Voucher code unrecognized' })).toBeVisible();
  await expect(total).toHaveText('$99.71');
  await page.getByLabel('Voucher code').fill('SUMMER');
  await page.getByRole('button', { name: 'Apply', exact: true }).click();
  await expect(page.getByRole('status').filter({ hasText: 'Voucher code unrecognized' })).toBeVisible();
  await expect(total).toHaveText('$99.71');
});
