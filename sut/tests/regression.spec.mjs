import { test, expect } from '@playwright/test';

test('STQA-01 header search focuses the field on every activation', async ({ page }) => {
  await page.goto('/');
  const searchLink = page.getByRole('link', { name: 'Search perfumes' });
  const search = page.getByRole('textbox', { name: 'Search perfumes' });

  await searchLink.press('Enter');
  await expect(search).toBeFocused();
  await searchLink.press('Enter');
  await expect(search).toBeFocused();
  await page.keyboard.type('bergamot');
  await expect(search).toHaveValue('bergamot');
  await searchLink.press('Enter');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('bergamot');
  await page.goto('/shop?q=bergamot&search=1');
  await searchLink.press('Enter');
  await expect(search).toBeFocused();
  await expect(search).toHaveValue('bergamot');
  await expect(page).toHaveURL(/\/shop\?q=bergamot&search=1$/);
  if (process.env.QA_SCREENSHOTS) {
    await page.screenshot({ path: test.info().outputPath('catalog-keyboard-focus.png') });
  }
});

test('UX-02 quick view returns keyboard focus to its opener after Escape', async ({ page }) => {
  await page.goto('/catalog');
  const card = page.locator('.perfume-card').filter({ hasText: 'CK One' });
  const opener = card.getByRole('button', { name: 'Quick view' });
  await opener.focus();
  await opener.press('Enter');
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.getByRole('dialog')).toBeHidden();
  await expect(opener).toBeFocused();
});
