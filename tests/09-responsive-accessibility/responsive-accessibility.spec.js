const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget, openCart } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-029: verifica overflow horizontal na matriz de viewports da linha de base', async ({ page }, testInfo) => {
  const viewports = [
    { width: 320, height: 568 },
    { width: 360, height: 800 },
    { width: 390, height: 844 },
    { width: 768, height: 1024 },
    { width: 1024, height: 768 },
    { width: 1366, height: 768 },
  ];
  const observations = [];
  await page.goto('/');

  for (const viewport of viewports) {
    await page.setViewportSize(viewport);
    const measurement = await page.evaluate(() => ({
      width: window.innerWidth,
      documentWidth: document.documentElement.scrollWidth,
      bodyWidth: document.body.scrollWidth,
    }));
    const overflow = measurement.documentWidth > measurement.width + 1;
    observations.push({ ...measurement, overflow });
    expect.soft(overflow, `overflow horizontal em ${viewport.width}px`).toBe(false);
  }

  await testInfo.attach('viewport-matrix.json', {
    body: Buffer.from(JSON.stringify(observations, null, 2)),
    contentType: 'application/json',
  });
});

test.describe('Contexto móvel com toque habilitado', () => {
  test.use({
    viewport: { width: 390, height: 844 },
    deviceScaleFactor: 1,
    isMobile: true,
    hasTouch: true,
  });

  test('CT-030: opera quantidade e adição sem depender de hover em toque', async ({ page }, testInfo) => {
  await page.goto('/');

  const card = page.locator('.card-item').first();
  await card.scrollIntoViewIfNeeded();
  const increment = card.locator('.btn-mais');
  const initiallyVisible = await increment.isVisible();
  expect.soft(initiallyVisible, 'os controles devem ser descobríveis sem hover').toBe(true);

  const cardBox = await card.boundingBox();
  if (cardBox) await page.touchscreen.tap(cardBox.x + cardBox.width / 2, cardBox.y + cardBox.height / 2);

  const incrementBox = await increment.boundingBox();
  let quantityAfterTap = null;
  let badgeAfterAdd = null;
  if (incrementBox) {
    await page.touchscreen.tap(incrementBox.x + incrementBox.width / 2, incrementBox.y + incrementBox.height / 2);
    quantityAfterTap = await card.locator('.add-numero-itens').innerText();
    expect.soft(quantityAfterTap.trim()).toBe('1');

    const add = card.locator('.btn-add');
    const addBox = await add.boundingBox();
    if (addBox) {
      await page.touchscreen.tap(addBox.x + addBox.width / 2, addBox.y + addBox.height / 2);
      badgeAfterAdd = await page.locator('.badge-total-carrinho').first().innerText();
      expect.soft(badgeAfterAdd.trim()).toBe('1');
      await expect(card.locator('.add-numero-itens')).toHaveText('0');
    }
  }

  await testInfo.attach('touch-interaction.json', {
    body: Buffer.from(JSON.stringify({ initiallyVisible, quantityAfterTap, badgeAfterAdd }, null, 2)),
    contentType: 'application/json',
  });
  });
});

test('CT-031: expõe controles principais à navegação por teclado', async ({ page }, testInfo) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const controls = await page.evaluate(() => {
    const selectors = [
      '.navbar-toggler',
      '#navbarNavDropdown a.nav-link',
      '#navbarNavDropdown .btn-icon',
      '.container-menu [onclick]',
      '.card-item .add-carrinho [onclick]',
      '#btnEtapaPedido',
      '#btnEtapaEndereco',
      '#btnEtapaResumo',
      '#btnVoltar',
    ];
    const elements = selectors.flatMap((selector) => [...document.querySelectorAll(selector)]);
    return [...new Set(elements)].map((element) => ({
      id: element.id || null,
      className: typeof element.className === 'string' ? element.className : '',
      tag: element.tagName.toLowerCase(),
      focusable: element.matches('button, input, select, textarea, a[href], [tabindex]:not([tabindex="-1"])'),
    }));
  });
  const violations = controls.filter((control) => !control.focusable);
  await testInfo.attach('keyboard-focusability.json', {
    body: Buffer.from(JSON.stringify({ controls, violations }, null, 2)),
    contentType: 'application/json',
  });
  expect.soft(violations, 'controles que alteram o estado precisam ser alcançáveis por teclado').toEqual([]);

  const toggler = page.locator('.navbar-toggler');
  await toggler.focus();
  await page.keyboard.press('Enter');
  await expect(page.locator('#navbarNavDropdown')).toBeVisible();

  await page.locator('#navbarNavDropdown .btn-icon').click();
  await expect(page.locator('#modalCarrinho')).toBeVisible();
  await page.keyboard.press('Escape');
  await expect(page.locator('#modalCarrinho')).toBeHidden();
});

test('CT-032: confere idioma, rótulos e nomes acessíveis básicos', async ({ page }, testInfo) => {
  await page.goto('/');
  const audit = await page.evaluate(() => {
    const accessibleName = (element) => {
      const labelledBy = (element.getAttribute('aria-labelledby') || '')
        .split(/\s+/)
        .filter(Boolean)
        .map((id) => document.getElementById(id)?.textContent.trim() || '')
        .join(' ')
        .trim();
      const labelText = [...(element.labels || [])].map((label) => label.textContent.trim()).join(' ').trim();
      return element.getAttribute('aria-label')?.trim()
        || labelledBy
        || labelText
        || element.getAttribute('title')?.trim()
        || element.getAttribute('alt')?.trim()
        || element.innerText?.trim()
        || element.value?.trim()
        || '';
    };

    const fields = [...document.querySelectorAll('#localEntrega input, #localEntrega select')].map((element) => ({
      id: element.id,
      hasAssociatedLabel: Boolean(element.labels?.length || element.getAttribute('aria-label') || element.getAttribute('aria-labelledby')),
    }));
    const actions = [...document.querySelectorAll(
      '.navbar-toggler, #navbarNavDropdown .btn-icon, .container-menu [onclick], .card-item .add-carrinho [onclick], #btnEtapaPedido, #btnEtapaEndereco, #btnEtapaResumo, #btnVoltar',
    )].map((element) => ({
      id: element.id || null,
      className: typeof element.className === 'string' ? element.className : '',
      tag: element.tagName.toLowerCase(),
      hasAccessibleName: accessibleName(element).length > 0,
    }));

    return {
      language: document.documentElement.lang,
      fieldsWithoutLabel: fields.filter((field) => !field.hasAssociatedLabel),
      actionsWithoutName: actions.filter((action) => !action.hasAccessibleName),
    };
  });

  await testInfo.attach('accessible-baseline.json', {
    body: Buffer.from(JSON.stringify(audit, null, 2)),
    contentType: 'application/json',
  });
  expect.soft(audit.language).toBe('pt-BR');
  expect.soft(audit.fieldsWithoutLabel, 'campos do endereço devem ter rótulos programáticos').toEqual([]);
  expect(audit.actionsWithoutName, 'ações principais devem ter nome acessível').toEqual([]);
});
