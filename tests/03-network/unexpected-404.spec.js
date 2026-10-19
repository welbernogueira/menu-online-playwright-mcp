const { test, expect } = require('@playwright/test');
const {
  KNOWN_ISSUES,
  knownIssueForUrl,
  collectHttpResponses,
  attachJson,
} = require('../support/known-issues');

test('CT-004 acceptance: nenhum recurso solicitado responde 404', async ({ page }, testInfo) => {
  const responses = collectHttpResponses(page);
  await page.goto('/');

  const httpFailures = responses.filter((response) => response.status >= 400);
  const notFound = httpFailures.filter((response) => response.status === 404);
  const classified404 = notFound.map((response) => ({
    ...response,
    knownIssue: knownIssueForUrl(response.url)?.id,
  }));
  const historicalIssue404 = classified404.filter((response) => response.knownIssue);
  const unexpected404 = classified404.filter((response) => !response.knownIssue);

  await attachJson(testInfo, 'ct-004-network-baseline.json', {
    allHttpFailures: httpFailures,
    notFound: classified404,
    historicalIssue404,
    knownIssueDefinitions: KNOWN_ISSUES,
    unexpected404,
  });

  expect(
    unexpected404,
    '404 novos ou não documentados devem ser detectados',
  ).toEqual([]);
  expect(
    historicalIssue404,
    '404 de defeitos já corrigidos também devem ser detectados como regressão',
  ).toEqual([]);
});
