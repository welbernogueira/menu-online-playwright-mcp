const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, openAddressStep, fillAddress } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-021: preenche endereço a partir de uma resposta ViaCEP controlada', async ({ page }) => {
  const cep = '00000000';
  const response = {
    cep: '00000-000',
    logradouro: 'Rua de Teste',
    complemento: '',
    unidade: '',
    bairro: 'Bairro de Teste',
    localidade: 'Cidade de Teste',
    uf: 'PB',
    estado: 'Paraíba',
    regiao: 'Nordeste',
    ibge: '0000000',
    gia: '',
    ddd: '83',
    siafi: '0000',
  };

  await page.route(`https://viacep.com.br/ws/${cep}/json/**`, async (route) => {
    const callback = new URL(route.request().url()).searchParams.get('callback');
    expect(callback).toBeTruthy();
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: `${callback}(${JSON.stringify(response)});`,
    });
  });

  await page.goto('/');
  await openAddressStep(page);
  await page.locator('#txtCEP').fill(cep);
  await page.locator('.container-cep .btn').click();

  await expect(page.locator('#txtEndereco')).toHaveValue(response.logradouro);
  await expect(page.locator('#txtBairro')).toHaveValue(response.bairro);
  await expect(page.locator('#txtCidade')).toHaveValue(response.localidade);
  await expect(page.locator('#ddlUF')).toHaveValue(response.uf);
});

test('CT-022: informa CEP não encontrado e permite recuperação após falha do ViaCEP', async ({ page }, testInfo) => {
  const notFoundCep = '99999998';
  await page.route(`**/ws/${notFoundCep}/json/**`, async (route) => {
    const callback = new URL(route.request().url()).searchParams.get('callback');
    expect(callback).toBeTruthy();
    await route.fulfill({
      status: 200,
      contentType: 'application/javascript; charset=utf-8',
      body: `${callback}({"erro": true});`,
    });
  });

  await page.goto('/');
  await openAddressStep(page);
  await fillAddress(page, {
    cep: notFoundCep,
    endereco: 'Rua Preservada QA',
    bairro: 'Bairro Preservado QA',
    cidade: 'Cidade Preservada QA',
  });
  await page.locator('.container-cep .btn').click();
  const notFoundToast = page.locator('.toast').filter({ hasText: /cep não encontrado/i });
  await expect(notFoundToast).toBeVisible();
  await expect(notFoundToast).toContainText(/manualmente/i);
  await expect(page.locator('#txtEndereco')).toHaveValue('Rua Preservada QA');
  await expect(page.locator('#txtBairro')).toHaveValue('Bairro Preservado QA');
  await expect(page.locator('#txtCidade')).toHaveValue('Cidade Preservada QA');

  await page.locator('#btnEtapaEndereco').click();
  await expect(page.locator('#resumoCarrinho')).toBeVisible();

  const networkPage = await page.context().newPage();
  const networkCep = '99999997';
  await networkPage.route(`**/ws/${networkCep}/json/**`, (route) => route.abort('failed'));
  await networkPage.goto('/');
  await openAddressStep(networkPage);
  await fillAddress(networkPage, { cep: networkCep });
  await networkPage.locator('.container-cep .btn').click();

  const recoverableMessage = networkPage.locator('.toast').filter({
    hasText: /cep|consulta|falha|indispon[ií]vel|manualmente|tente novamente/i,
  });
  const networkFeedback = await recoverableMessage.isVisible().catch(() => false);
  expect.soft(networkFeedback, 'falha de rede deve produzir feedback que permita recuperação').toBe(true);
  await expect(networkPage.locator('#txtCEP')).toHaveValue(networkCep);
  await expect(networkPage.locator('#localEntrega')).toBeVisible();
  await networkPage.locator('#btnEtapaEndereco').click();
  const manualRecoverySucceeded = await networkPage.locator('#resumoCarrinho').isVisible();
  expect.soft(manualRecoverySucceeded, 'o preenchimento manual deve continuar disponível após a falha').toBe(true);

  await testInfo.attach('viacep-recovery.json', {
    body: Buffer.from(JSON.stringify({
      notFound: { feedbackPresent: true, manualRecoverySucceeded: true },
      networkFailure: { feedbackPresent: networkFeedback, manualRecoverySucceeded },
      serviceCalls: 'mocked locally; no public ViaCEP request was sent',
    }, null, 2)),
    contentType: 'application/json',
  });
  await networkPage.close();
});
