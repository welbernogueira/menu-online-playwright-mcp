const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-006 [smoke] [regression]: navega pelas âncoras principais', async ({ page }) => {
  await page.goto('/');

  const sections = [
    ['Reservas', '#reservas'],
    ['Serviços', '#servicos'],
    ['Cardápio', '#cardapio'],
    ['Depoimentos', '#depoimentos'],
  ];

  for (const [name, target] of sections) {
    const link = page.locator(`.navbar-nav .nav-link[href="${target}"]`);
    await expect(link, `link de navegação ${name}`).toBeVisible();
    await expect(link).toHaveAttribute('href', target);
    await link.click();
    await expect(page).toHaveURL(new RegExp(`${target}$`));
    await expect(page.locator(target)).toBeVisible();
  }

  await page.locator('.navbar-brand[href="#"]').click();
  await expect.poll(() => page.evaluate(() => window.scrollY)).toBe(0);
});
