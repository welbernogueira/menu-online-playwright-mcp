const { test } = require('@playwright/test');
const { requireIsolatedTarget, deferUntilDecision } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-018: valida os campos obrigatórios do endereço', async ({ page }) => {
  deferUntilDecision(test, 'a lista aprovada de campos e mensagens obrigatórios ainda não foi definida (perguntas 3 e 10).');
});

test('CT-019: rejeita UF não selecionada', async ({ page }) => {
  deferUntilDecision(test, 'a obrigatoriedade da seleção de UF aguarda decisão (pergunta 1).');
});

test('CT-020: valida o formato de CEP preenchido manualmente', async ({ page }) => {
  deferUntilDecision(test, 'o formato e a aceitação de CEP manual aguardam decisão (perguntas 2 e 10).');
});

test('CT-023: confirma o tratamento do complemento', async ({ page }) => {
  deferUntilDecision(test, 'a obrigatoriedade e o tratamento do complemento ainda não foram aprovados (pergunta 3).');
});

test('CT-024: retorna à etapa de endereço durante a revisão', async ({ page }) => {
  deferUntilDecision(test, 'a preservação ou limpeza dos campos ao voltar ainda não foi definida (pergunta 9).');
});
