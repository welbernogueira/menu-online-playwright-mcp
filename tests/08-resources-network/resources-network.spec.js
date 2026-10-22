const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget } = require('../support/menu-online');
const { collectHttpResponses, attachJson } = require('../support/known-issues');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-028 [smoke] [regression]: detecta falhas de recursos ao percorrer a página', async ({ page }, testInfo) => {
  const responses = collectHttpResponses(page);
  await page.goto('/');

  const sections = await page.locator('section').all();
  for (const section of sections) {
    await section.scrollIntoViewIfNeeded();
    await expect(section).toBeAttached();
  }

  const appOrigin = new URL(process.env.BASE_URL).origin;
  const failures = responses.filter((response) => response.status >= 400);
  const appFailures = failures.filter((response) => new URL(response.url).origin === appOrigin);
  const externalFailures = failures.filter((response) => new URL(response.url).origin !== appOrigin);

  await attachJson(testInfo, 'ct-028-resource-responses.json', {
    responses,
    appFailures,
    externalFailures,
  });

  expect(appFailures, 'recursos do próprio site não devem falhar ao percorrer as seções').toEqual([]);
});
