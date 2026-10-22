const { test } = require('@playwright/test');
const { requireIsolatedTarget, deferUntilDecision } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-033: verifica compatibilidade nos navegadores suportados', async ({ page }) => {
  deferUntilDecision(test, 'a lista oficial de navegadores e versões suportados ainda não foi definida (pergunta 21).');
});

test('CT-036: mede carregamento com orçamento aprovado', async ({ page }) => {
  deferUntilDecision(test, 'métrica, ambiente e orçamento de desempenho ainda não foram definidos.');
});
