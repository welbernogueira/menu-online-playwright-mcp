const { test } = require('@playwright/test');
const { requireIsolatedTarget, deferUntilDecision } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-025: confere preparo do link de pedido sem envio', async ({ page }) => {
  deferUntilDecision(test, 'destino aprovado e conteúdo exato da mensagem ainda não foram definidos (perguntas 17–19).');
});

test('CT-026: confere links de reserva e telefone sem ativá-los', async ({ page }) => {
  deferUntilDecision(test, 'os destinos oficiais dos links de reserva e telefone ainda não foram confirmados (perguntas 16–17).');
});

test('CT-034: verifica exposição de endereço em logs e evidências', async ({ page }) => {
  deferUntilDecision(test, 'a política de logs, privacidade e retenção ainda não foi definida (perguntas 25–26).');
});
