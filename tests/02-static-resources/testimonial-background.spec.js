const { test, expect } = require('@playwright/test');
const { knownIssueForUrl, collectHttpResponses, attachJson } = require('../support/known-issues');

test('CT-003 acceptance: recurso do fundo dos depoimentos carrega sem 404', async ({ page }, testInfo) => {
  const responses = collectHttpResponses(page);
  await page.goto('/');

  const background = await page.locator('.background-depoimentos').evaluate((element) => {
    const computed = getComputedStyle(element).backgroundImage;
    const match = computed.match(/^url\(["']?(.*?)["']?\)$/);
    return {
      computed,
      url: match ? new URL(match[1], document.baseURI).href : null,
    };
  });
  const response = background.url
    ? responses.find((entry) => entry.url === background.url)
    : undefined;
  const issue = response && knownIssueForUrl(response.url);

  await attachJson(testInfo, 'ct-003-background-baseline.json', {
    background,
    response,
    knownIssue: issue?.id,
  });

  expect(background.url, 'URL de imagem definida no CSS computado').toBeTruthy();
  expect(response, `requisição observada para ${background.url}`).toBeDefined();
  expect(response.status, `${background.url} deve responder sem erro HTTP`).toBeLessThan(400);
});
