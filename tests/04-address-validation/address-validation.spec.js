const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, openAddressStep, fillAddress } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-018: bloqueia a revisão quando um campo obrigatório está vazio ou contém espaços', async ({ page }, testInfo) => {
  const cases = [
    { selector: '#txtCEP', key: 'cep', label: 'CEP', message: /cep/i },
    { selector: '#txtEndereco', key: 'endereco', label: 'endereço', message: /endere[cç]o/i },
    { selector: '#txtBairro', key: 'bairro', label: 'bairro', message: /bairro/i },
    { selector: '#txtCidade', key: 'cidade', label: 'cidade', message: /cidade/i },
    { selector: '#txtNumero', key: 'numero', label: 'número', message: /n[uú]mero/i },
  ];
  const invalidValues = ['', '   '];
  const observations = [];

  await page.goto('/');
  await openAddressStep(page);
  const address = await fillAddress(page);
  for (const field of cases) {
    for (const invalidValue of invalidValues) {
      await page.locator(field.selector).fill(invalidValue);
      await page.locator('#btnEtapaEndereco').click();

      const stayedOnAddress = await page.locator('#localEntrega').isVisible();
      const focused = await page.locator(field.selector).evaluate((element) => document.activeElement === element);
      const message = await page.locator('.toast').last().textContent().catch(() => '');
      observations.push({ field: field.label, value: invalidValue ? 'espaços' : '(vazio)', stayedOnAddress, focused, feedback: field.message.test(message || '') });

      expect.soft(stayedOnAddress, `${field.label} (${invalidValue ? 'espaços' : 'vazio'}): a revisão deve permanecer no endereço`).toBe(true);
      expect.soft(focused, `${field.label} (${invalidValue ? 'espaços' : 'vazio'}): o foco deve ir ao primeiro campo inválido`).toBe(true);
      expect.soft(message || '', `${field.label}: deve haver feedback identificável`).toMatch(field.message);
      await page.locator(field.selector).fill(address[field.key]);
    }
  }

  await testInfo.attach('required-address-fields.json', {
    body: Buffer.from(JSON.stringify(observations, null, 2)),
    contentType: 'application/json',
  });
});

test('CT-019: rejeita o placeholder de UF na revisão', async ({ page }, testInfo) => {
  await page.goto('/');
  await openAddressStep(page);
  await fillAddress(page, { uf: '-1' });
  await page.locator('#btnEtapaEndereco').click();

  const stayedOnAddress = await page.locator('#localEntrega').isVisible();
  const focused = await page.locator('#ddlUF').evaluate((element) => document.activeElement === element);
  const message = await page.locator('.toast').last().textContent().catch(() => '');
  await testInfo.attach('uf-placeholder.json', {
    body: Buffer.from(JSON.stringify({ stayedOnAddress, focused, feedbackPresent: /uf|unidade federativa/i.test(message || '') }, null, 2)),
    contentType: 'application/json',
  });

  expect.soft(stayedOnAddress, 'UF placeholder deve manter o usuário na etapa de endereço').toBe(true);
  expect.soft(focused, 'o foco deve ir ao seletor de UF').toBe(true);
  expect(message || '').toMatch(/uf|unidade federativa/i);
});

test('CT-020: valida o formato e normaliza CEP preenchido manualmente', async ({ page }, testInfo) => {
  const cases = [
    { cep: '12345678', accepted: true, normalized: '12345678' },
    { cep: '12345-678', accepted: true, normalized: '12345678' },
    { cep: '1234567', accepted: false },
    { cep: '123456789', accepted: false },
    { cep: '12A45678', accepted: false },
    { cep: '12 345678', accepted: false },
    { cep: '1234-5678', accepted: false },
  ];
  const observations = [];

  await page.goto('/');
  await openAddressStep(page);
  await fillAddress(page);
  for (const scenario of cases) {
    await page.locator('#txtCEP').fill(scenario.cep);
    await page.locator('#btnEtapaEndereco').click();

    const summaryVisible = await page.locator('#resumoCarrinho').isVisible();
    const summary = summaryVisible ? await page.locator('#cidadeEndereco').innerText() : '';
    observations.push({ input: scenario.cep, accepted: scenario.accepted, summaryVisible, summary });

    expect.soft(summaryVisible, `CEP ${scenario.cep}: etapa de revisão esperada=${scenario.accepted}`).toBe(scenario.accepted);
    if (scenario.accepted) {
      expect.soft(summary, `CEP ${scenario.cep}: resumo deve usar somente oito dígitos`).toContain(`/ ${scenario.normalized}`);
    } else {
      const focused = await page.locator('#txtCEP').evaluate((element) => document.activeElement === element);
      const message = await page.locator('.toast').last().textContent().catch(() => '');
      expect.soft(focused, `CEP ${scenario.cep}: foco deve retornar ao campo`).toBe(true);
      expect.soft(message || '', `CEP ${scenario.cep}: deve haver mensagem de validação`).toMatch(/cep|formato|inv[aá]lido/i);
    }

    if (summaryVisible) {
      await page.locator('#btnVoltar').click();
      await expect(page.locator('#localEntrega')).toBeVisible();
    }
  }

  await testInfo.attach('manual-postal-code-cases.json', {
    body: Buffer.from(JSON.stringify(observations, null, 2)),
    contentType: 'application/json',
  });
});

test('CT-023: aceita complemento vazio e preserva complemento preenchido', async ({ page }, testInfo) => {
  const cases = ['', 'Apto QA 12'];
  const observations = [];

  for (let index = 0; index < cases.length; index += 1) {
    const scenarioPage = index === 0 ? page : await page.context().newPage();
    const complement = cases[index];
    await scenarioPage.goto('/');
    await openAddressStep(scenarioPage);
    await fillAddress(scenarioPage, { complemento: complement });
    await scenarioPage.locator('#btnEtapaEndereco').click();

    const summaryVisible = await scenarioPage.locator('#resumoCarrinho').isVisible();
    const summaryAddress = summaryVisible ? await scenarioPage.locator('#cidadeEndereco').innerText() : '';
    observations.push({ complement: complement || '(vazio)', summaryVisible, summaryAddress });

    expect.soft(summaryVisible, `complemento ${complement || 'vazio'} não deve bloquear a revisão`).toBe(true);
    if (complement) expect.soft(summaryAddress).toContain(complement);
    if (index > 0) await scenarioPage.close();
  }

  await testInfo.attach('complement-cases.json', {
    body: Buffer.from(JSON.stringify(observations, null, 2)),
    contentType: 'application/json',
  });
});

test('CT-024: preserva endereço e carrinho ao voltar da revisão', async ({ page }) => {
  await page.goto('/');
  await openAddressStep(page);
  const address = await fillAddress(page, {
    cep: '58000000',
    endereco: 'Rua Retorno QA',
    bairro: 'Bairro Retorno QA',
    numero: '77',
    cidade: 'Cidade Retorno QA',
    complemento: 'Casa QA',
    uf: 'PB',
  });
  await page.locator('#btnEtapaEndereco').click();
  await expect(page.locator('#resumoCarrinho')).toBeVisible();

  const orderSummary = await page.locator('#resumoEndereco').innerText();
  const citySummary = await page.locator('#cidadeEndereco').innerText();
  const totalBefore = await page.locator('#lblValorTotal').innerText();
  await page.locator('#btnVoltar').click();
  await expect(page.locator('#localEntrega')).toBeVisible();

  await expect(page.locator('#txtCEP')).toHaveValue(address.cep);
  await expect(page.locator('#txtEndereco')).toHaveValue(address.endereco);
  await expect(page.locator('#txtBairro')).toHaveValue(address.bairro);
  await expect(page.locator('#txtNumero')).toHaveValue(address.numero);
  await expect(page.locator('#txtCidade')).toHaveValue(address.cidade);
  await expect(page.locator('#txtComplemento')).toHaveValue(address.complemento);
  await expect(page.locator('#ddlUF')).toHaveValue(address.uf);

  await page.locator('#btnEtapaEndereco').click();
  await expect(page.locator('#resumoCarrinho')).toBeVisible();
  await expect(page.locator('#resumoEndereco')).toHaveText(orderSummary);
  await expect(page.locator('#cidadeEndereco')).toHaveText(citySummary);
  await expect(page.locator('#listaItensResumo .item-carrinho')).toHaveCount(1);
  await expect(page.locator('#lblValorTotal')).toHaveText(totalBefore);
});
