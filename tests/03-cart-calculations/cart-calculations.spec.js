const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, addFirstProduct, openCart, deferUntilDecision } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-015 [regression]: bloqueia avanço com carrinho vazio', async ({ page }) => {
  await page.goto('/');
  await openCart(page);
  await expect(page.locator('#itensCarrinho .carrinho-vazio')).toBeVisible();
  await page.locator('#btnEtapaPedido').click();
  await expect(page.locator('#localEntrega')).toBeHidden();
  await expect(page.locator('.toast').filter({ hasText: 'Seu carrinho está vazio!' })).toBeVisible();
});

test('CT-016 [regression]: altera quantidades e remove o último item', async ({ page }) => {
  await page.goto('/');
  const card = await addFirstProduct(page, 2);
  const cardId = await card.getAttribute('id');
  await openCart(page);

  const row = page.locator('#itensCarrinho .item-carrinho');
  const quantity = page.locator(`[id="qntd-carrinho-${cardId}"]`);
  await expect(row).toHaveCount(1);
  await expect(quantity).toHaveText('2');

  await row.locator('.btn-menos').click();
  await expect(quantity).toHaveText('1');
  await row.locator('.btn-mais').click();
  await expect(quantity).toHaveText('2');
  await expect(page.locator('.badge-total-carrinho').first()).toHaveText('2');

  await row.locator('.btn-remove').click();
  await expect(page.locator('#itensCarrinho .item-carrinho')).toHaveCount(0);
  await expect(page.locator('#itensCarrinho .carrinho-vazio')).toBeVisible();
  await expect(page.locator('.badge-total-carrinho').first()).toHaveText('0');
});

test('CT-017: confere subtotal, entrega e total conforme regra aprovada', async ({ page }) => {
  deferUntilDecision(test, 'a taxa e a regra de cálculo da entrega ainda não foram confirmadas (pergunta 6 de perguntas-pendentes.md).');
});
