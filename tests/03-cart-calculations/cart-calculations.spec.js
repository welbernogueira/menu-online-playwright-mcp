const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, addFirstProduct, openCart } = require('../support/menu-online');

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

function moneyToCents(value) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Math.round(Number(normalized) * 100);
}

test('CT-017: calcula subtotal, taxa fixa e total conforme a linha de base de QA', async ({ page }) => {
  await page.goto('/');
  const card = await addFirstProduct(page, 2);
  const cardId = await card.getAttribute('id');
  const unitPrice = moneyToCents(await card.locator('.price-produto').innerText());

  await addFirstProduct(page, 1);
  await openCart(page);

  const cartRow = page.locator('#itensCarrinho .item-carrinho').first();
  await expect(cartRow).toBeVisible();
  await expect(page.locator(`[id="qntd-carrinho-${cardId}"]`)).toHaveText('3');

  const subtotal = moneyToCents(await page.locator('#lblSubtotal').innerText());
  const delivery = moneyToCents(await page.locator('#lblEntrega').innerText());
  const total = moneyToCents(await page.locator('#lblValorTotal').innerText());

  expect(subtotal).toBe(unitPrice * 3);
  expect(delivery).toBe(500);
  expect(total).toBe(subtotal + delivery);
});
