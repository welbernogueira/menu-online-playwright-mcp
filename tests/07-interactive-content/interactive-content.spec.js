const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-027: troca depoimento e mantém seletor ativo correspondente', async ({ page }) => {
  await page.goto('/');
  await page.locator('#depoimentos').scrollIntoViewIfNeeded();

  for (const index of [2, 3]) {
    const button = page.locator(`#btnDepoimento-${index}`);
    await expect(button).toBeVisible();
    await button.click();
    await expect(page.locator(`#depoimento-${index}`)).toBeVisible();
    await expect(button).toHaveClass(/active/);

    for (const other of [1, 2, 3].filter((value) => value !== index)) {
      await expect(page.locator(`#depoimento-${other}`)).toBeHidden();
      await expect(page.locator(`#btnDepoimento-${other}`)).not.toHaveClass(/active/);
    }
  }
});
