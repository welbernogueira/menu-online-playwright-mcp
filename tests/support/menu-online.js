const { expect } = require('@playwright/test');

const PRODUCTION_HOST = 'menu-online-project.vercel.app';

function requireIsolatedTarget(test) {
  const configuredBaseUrl = process.env.BASE_URL;
  test.skip(
    !configuredBaseUrl,
    'Defina BASE_URL para uma aplicação local ou preview isolado antes de executar esta suíte.',
  );

  const target = new URL(configuredBaseUrl);
  test.skip(
    target.hostname.toLowerCase() === PRODUCTION_HOST,
    'Esta suíte não deve alterar estado nem exercitar integrações contra produção.',
  );
}

async function selectFirstProduct(page, quantity = 1) {
  const card = page.locator('.card-item').first();
  await card.hover();

  for (let index = 0; index < quantity; index += 1) {
    await card.locator('.btn-mais').click();
  }

  return card;
}

async function addFirstProduct(page, quantity = 1) {
  const card = await selectFirstProduct(page, quantity);
  await card.locator('.btn-add').click();
  return card;
}

async function openCart(page) {
  await page.locator('#navbarNavDropdown .btn-icon').click();
  await expect(page.locator('#modalCarrinho')).toBeVisible();
}

async function openAddressStep(page) {
  await addFirstProduct(page);
  await openCart(page);
  await page.locator('#btnEtapaPedido').click();
  await expect(page.locator('#localEntrega')).toBeVisible();
}

function deferUntilDecision(test, reason) {
  test.fixme(true, `Pendente de critério aprovado: ${reason}`);
}

module.exports = {
  requireIsolatedTarget,
  selectFirstProduct,
  addFirstProduct,
  openCart,
  openAddressStep,
  deferUntilDecision,
};
