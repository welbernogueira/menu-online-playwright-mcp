const { test, expect } = require('@playwright/test');

test('CT-001: carrega a página inicial e apresenta o conteúdo principal', async ({ page }) => {
  await page.goto('/');

  await expect(page).toHaveTitle('Menu On-Line');
  await expect(
    page.getByRole('heading', { name: 'Escolha sua comida favorita.' }),
  ).toBeVisible();
  await expect(page.getByRole('link', { name: 'Cardápio', exact: true })).toBeVisible();
});
