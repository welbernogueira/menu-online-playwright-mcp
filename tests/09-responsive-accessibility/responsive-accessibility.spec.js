const { test } = require('@playwright/test');
const { requireIsolatedTarget, deferUntilDecision } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-029: verifica layout em larguras representativas', async ({ page }) => {
  deferUntilDecision(test, 'a matriz de viewports e as tolerâncias de clipping ainda não foram aprovadas.');
});

test('CT-030: acessa controles de produto por toque', async ({ page }) => {
  deferUntilDecision(test, 'a operação esperada dos controles em touchscreen ainda não foi confirmada (pergunta 23).');
});

test('CT-031: opera navegação e modal usando teclado', async ({ page }) => {
  deferUntilDecision(test, 'o alvo de acessibilidade e os critérios de foco, ordem e teclado ainda não foram definidos (pergunta 22).');
});

test('CT-032: confere idioma, nomes acessíveis e rótulos', async ({ page }) => {
  deferUntilDecision(test, 'o idioma declarado e o padrão de acessibilidade esperado ainda não foram aprovados (perguntas 20 e 22).');
});
