const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, selectFirstProduct, addFirstProduct, openCart } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-012: impede quantidade negativa no seletor do produto', async ({ page }) => {
  await page.goto('/');
  const card = await selectFirstProduct(page, 0);
  const quantity = card.locator('.add-numero-itens');

  await card.locator('.btn-menos').click();
  await expect(quantity).toHaveText('0');
  await card.locator('.btn-mais').click();
  await expect(quantity).toHaveText('1');
  await card.locator('.btn-menos').click();
  await expect(quantity).toHaveText('0');
});

test('CT-013: não adiciona produto com quantidade zero', async ({ page }) => {
  await page.goto('/');
  const card = page.locator('.card-item').first();
  await card.hover();
  await card.locator('.btn-add').click();

  await expect(page.locator('.badge-total-carrinho').first()).toHaveText('0');
  await openCart(page);
  await expect(page.locator('#itensCarrinho .item-carrinho')).toHaveCount(0);
  await expect(page.locator('#itensCarrinho .carrinho-vazio')).toBeVisible();
});

test('CT-014 [regression]: soma adições repetidas do mesmo produto em uma linha', async ({ page }) => {
  await page.goto('/');
  const card = await addFirstProduct(page);
  const cardId = await card.getAttribute('id');
  const selection = card.locator('.add-numero-itens');
  await expect(selection).toHaveText('0');

  await card.hover();
  await card.locator('.btn-mais').click();
  await card.locator('.btn-add').click();
  await card.locator('.btn-mais').click();
  await card.locator('.btn-add').click();

  await expect(page.locator('.badge-total-carrinho').first()).toHaveText('3');
  await openCart(page);

  const row = page.locator('#itensCarrinho .item-carrinho');
  await expect(row).toHaveCount(1);
  await expect(page.locator(`[id="qntd-carrinho-${cardId}"]`)).toHaveText('3');
});
