const { test, expect } = require('@playwright/test');
const {
  KNOWN_ISSUES,
  knownIssueForUrl,
  collectHttpResponses,
  attachJson,
} = require('../support/known-issues');

test('CT-004 acceptance: não há respostas 404 para recursos esperados', async ({ page }, testInfo) => {
  const responses = collectHttpResponses(page);
  await page.goto('/');

  const httpFailures = responses.filter((response) => response.status >= 400);
  const notFound = httpFailures.filter((response) => response.status === 404);
  const classified404 = notFound.map((response) => ({
    ...response,
    knownIssue: knownIssueForUrl(response.url)?.id,
  }));
  const unexpected404 = classified404.filter((response) => !response.knownIssue);

  await attachJson(testInfo, 'ct-004-network-baseline.json', {
    allHttpFailures: httpFailures,
    notFound: classified404,
    knownIssueDefinitions: KNOWN_ISSUES,
    unexpected404,
  });

  expect(
    unexpected404,
    '404 novos ou não documentados devem ser destacados separadamente',
  ).toEqual([]);
  expect(
    notFound,
    'critério de aceitação: nenhum recurso esperado deve responder 404',
  ).toEqual([]);
});
