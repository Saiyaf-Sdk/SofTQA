import { After, Before, Given, Then, When, setDefaultTimeout } from '@cucumber/cucumber';
import { chromium, expect } from '@playwright/test';
import { join } from 'node:path';

setDefaultTimeout(15000);

Before(async function () {
  this.browser = await chromium.launch({ channel: process.env.E2E_BROWSER_CHANNEL || undefined });
  this.page = await this.browser.newPage({ baseURL: process.env.QA_BASE_URL });
});

After(async function () {
  await this.browser?.close();
});

Given('I have one CK One in my guest bag at $84.00', async function () {
  await this.page.goto('/catalog');
  const card = this.page.locator('.perfume-card').filter({ hasText: 'CK One' });
  await card.hover();
  await card.getByRole('button', { name: 'Quick view' }).click();
  await this.page.getByRole('dialog').getByRole('button', { name: 'Add to bag' }).click();
  await this.page.getByRole('link', { name: 'Shopping bag, 1 items' }).click();
  await expect(this.page.getByText('$84.00 each', { exact: true })).toBeVisible();
});

When('I apply the voucher {string}', async function (code) {
  await this.page.getByLabel('Voucher code').fill(code);
  await this.page.getByRole('button', { name: 'Apply', exact: true }).click();
});

Then('the order summary shows {string}', async function (message) {
  await expect(this.page.getByRole('status').filter({ hasText: message })).toBeVisible();
});

Then('the total is {string}', async function (amount) {
  const summary = this.page.locator('.summary');
  await expect(summary.locator('.total strong')).toHaveText(amount);
  if (process.env.QA_SCREENSHOTS) {
    await summary.screenshot({
      path: join(process.env.QA_SCREENSHOTS, 'voucher-' + amount.slice(1) + '.png')
    });
  }
});
