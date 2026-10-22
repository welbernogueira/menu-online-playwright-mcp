const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, openAddressStep, deferUntilDecision } = require('../support/menu-online');

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

test('CT-022: trata CEP inexistente ou falha do ViaCEP', async ({ page }) => {
  deferUntilDecision(test, 'mensagem, retry e comportamento manual após indisponibilidade do ViaCEP ainda aguardam decisão (pergunta 5).');
});
