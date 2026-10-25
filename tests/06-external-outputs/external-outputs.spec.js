const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, addFirstProduct, openCart, openAddressStep, fillAddress } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

function moneyToCents(value) {
  const normalized = value.replace(/[^\d,.-]/g, '').replace(/\./g, '').replace(',', '.');
  return Math.round(Number(normalized) * 100);
}

function centsToBrazilianMoney(cents) {
  return (cents / 100).toFixed(2).replace('.', ',');
}

test('CT-025: prepara o link do pedido sem abrir nem enviar a mensagem', async ({ page }) => {
  await page.goto('/');
  const card = await addFirstProduct(page, 2);
  const productName = (await card.locator('.title-produto').innerText()).trim();
  const unitPrice = moneyToCents(await card.locator('.price-produto').innerText());
  await openCart(page);
  await page.locator('#btnEtapaPedido').click();
  const address = await fillAddress(page, {
    cep: '58000000',
    endereco: 'Rua Pedido QA',
    bairro: 'Centro Pedido QA',
    numero: '77',
    cidade: 'Cidade Pedido QA',
    complemento: 'Apto 4 QA',
    uf: 'PB',
  });
  await page.locator('#btnEtapaEndereco').click();
  await expect(page.locator('#resumoCarrinho')).toBeVisible();

  const href = await page.locator('#btnEtapaResumo').getAttribute('href');
  const orderUrl = new URL(href);
  const reservationUrl = new URL(await page.locator('#btnReserva').getAttribute('href'));
  const phone = orderUrl.pathname.split('/').filter(Boolean)[0];
  const message = orderUrl.searchParams.get('text') || '';
  const expectedTotal = unitPrice * 2 + 500;

  expect(orderUrl.protocol).toBe('https:');
  expect(orderUrl.hostname).toBe('wa.me');
  expect(phone).toMatch(/^\d{10,15}$/);
  expect(phone).toBe(reservationUrl.pathname.split('/').filter(Boolean)[0]);
  expect(message).toContain(`*2x* ${productName}`);
  expect(message).toContain(`R$ ${centsToBrazilianMoney(unitPrice)}`);
  expect(message).toContain(`${address.endereco}, ${address.numero}, ${address.bairro}`);
  expect(message).toContain(`${address.cidade}-${address.uf}`);
  expect(message).toContain(`CEP: ${address.cep}`);
  expect(message).toContain(address.complemento);
  expect(message).toContain(`R$ ${centsToBrazilianMoney(expectedTotal)}`);
  expect(page.url()).toContain('127.0.0.1');
  expect(page.context().pages()).toHaveLength(1);
});

test('CT-026: verifica o formato dos links de reserva e telefone sem ativá-los', async ({ page }) => {
  await page.goto('/');

  const reservationUrl = new URL(await page.locator('#btnReserva').getAttribute('href'));
  const telephoneHref = await page.locator('#btnLigar').getAttribute('href');
  const phone = reservationUrl.pathname.split('/').filter(Boolean)[0];
  const reservationMessage = reservationUrl.searchParams.get('text') || '';

  expect(reservationUrl.protocol).toBe('https:');
  expect(reservationUrl.hostname).toBe('wa.me');
  expect(phone).toMatch(/^\d{10,15}$/);
  expect(reservationMessage.trim()).not.toBe('');
  expect(telephoneHref).toBe(`tel:${phone}`);
  expect(page.url()).toContain('127.0.0.1');
  expect(page.context().pages()).toHaveLength(1);
});

test('CT-034: detecta endereço e conteúdo do pedido em logs de console', async ({ page }, testInfo) => {
  const markers = {
    endereco: 'ENDERECO_SINTETICO_QA_PRIVACIDADE',
    cep: '99999888',
    complemento: 'COMPLEMENTO_SINTETICO_QA_PRIVACIDADE',
  };
  const leaks = { endereco: false, cep: false, complemento: false, conteudoPedido: false };

  page.on('console', (message) => {
    const text = message.text();
    leaks.endereco ||= text.includes(markers.endereco);
    leaks.cep ||= text.includes(markers.cep);
    leaks.complemento ||= text.includes(markers.complemento);
    leaks.conteudoPedido ||= text.includes('Itens do pedido');
  });

  await page.goto('/');
  await openAddressStep(page);
  await fillAddress(page, {
    cep: markers.cep,
    endereco: markers.endereco,
    bairro: 'BAIRRO_SINTETICO_QA',
    numero: '123',
    cidade: 'CIDADE_SINTETICA_QA',
    complemento: markers.complemento,
    uf: 'PB',
  });
  await page.locator('#btnEtapaEndereco').click();
  await expect(page.locator('#resumoCarrinho')).toBeVisible();

  await testInfo.attach('privacy-observation.json', {
    body: Buffer.from(JSON.stringify({
      checks: Object.fromEntries(Object.entries(leaks).map(([key, value]) => [key, { containsSyntheticData: value }])),
      dataClass: 'synthetic QA values only; raw console text is not attached',
    }, null, 2)),
    contentType: 'application/json',
  });

  expect(leaks, 'console não deve registrar endereço, CEP, complemento ou mensagem completa').toEqual({
    endereco: false,
    cep: false,
    complemento: false,
    conteudoPedido: false,
  });
});
