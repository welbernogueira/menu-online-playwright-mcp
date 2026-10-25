const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, openCart } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-033: executa fluxo essencial no Chromium configurado', async ({ page, browser, browserName }, testInfo) => {
  expect(browserName).toBe('chromium');
  await page.goto('/');
  await expect(page).toHaveTitle(/Menu On-Line/i);
  await expect(page.locator('.card-item')).toHaveCount(8);
  await openCart(page);
  await expect(page.locator('#modalCarrinho')).toBeVisible();

  await testInfo.attach('browser-target.json', {
    body: Buffer.from(JSON.stringify({ browserName, version: browser.version(), baseURL: process.env.BASE_URL }, null, 2)),
    contentType: 'application/json',
  });
});

function median(values) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.floor(sorted.length / 2)];
}

test('CT-036: mede carregamento local contra o orçamento inicial de QA', async ({ page, browser }, testInfo) => {
  const readings = [];

  for (let index = 0; index < 3; index += 1) {
    let context;
    let measurementPage;
    if (index === 0) {
      measurementPage = page;
    } else {
      context = await browser.newContext({ baseURL: process.env.BASE_URL, serviceWorkers: 'block' });
      measurementPage = await context.newPage();
    }

    await measurementPage.goto('/', { waitUntil: 'load', timeout: 10000 });
    const timing = await measurementPage.evaluate(() => {
      const navigation = performance.getEntriesByType('navigation')[0];
      return {
        domContentLoadedMs: navigation.domContentLoadedEventEnd,
        loadEventMs: navigation.loadEventEnd,
      };
    });
    readings.push({ iteration: index + 1, ...timing });
    if (context) await context.close();
  }

  const domContentLoadedMedianMs = median(readings.map((reading) => reading.domContentLoadedMs));
  const loadEventMedianMs = median(readings.map((reading) => reading.loadEventMs));
  await testInfo.attach('navigation-timing.json', {
    body: Buffer.from(JSON.stringify({
      baseURL: process.env.BASE_URL,
      budgetMs: { domContentLoadedMedian: 2500, loadEventMedian: 5000, perNavigationTimeout: 10000 },
      readings,
      medianMs: { domContentLoaded: domContentLoadedMedianMs, loadEvent: loadEventMedianMs },
    }, null, 2)),
    contentType: 'application/json',
  });

  expect.soft(readings.every((reading) => reading.loadEventMs <= 10000), 'cada navegação precisa concluir no timeout').toBe(true);
  expect.soft(domContentLoadedMedianMs, 'mediana DOMContentLoaded').toBeLessThanOrEqual(2500);
  expect(loadEventMedianMs, 'mediana do evento load').toBeLessThanOrEqual(5000);
});
