const { test, expect } = require('@playwright/test');
const { requireIsolatedTarget } = require('../support/menu-online');

test.beforeEach(() => requireIsolatedTarget(test));

test('CT-007: abre e fecha a navegação mobile', async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await page.goto('/');

  const menu = page.locator('#navbarNavDropdown');
  const toggle = page.locator('.navbar-toggler');
  await expect(toggle).toBeVisible();
  await expect(menu).toBeHidden();

  await toggle.click();
  await expect(menu).toBeVisible();
  await expect(menu).not.toHaveClass(/collapsing/);
  await toggle.click();
  await expect(menu).toBeHidden();
  await toggle.click();
  await expect(menu).toBeVisible();
  await expect(menu).not.toHaveClass(/collapsing/);

  const cardapioLink = menu.locator('.nav-link[href="#cardapio"]');
  await expect(cardapioLink).toBeVisible();
  await cardapioLink.click();
  await expect(page).toHaveURL(/#cardapio$/);
});

test('CT-008: valida a estrutura e o conteúdo base das seções institucionais', async ({ page }) => {
  await page.goto('/');

  const sections = [
    { id: 'servicos', label: 'Serviços' },
    { id: 'cardapio', label: 'Cardápio' },
    { id: 'depoimentos', label: 'Depoimentos' },
    { id: 'reservas', label: 'Reservas' },
  ];

  for (const section of sections) {
    const target = page.locator(`#${section.id}`);
    await expect(target).toHaveCount(1);
    await expect(page.locator(`#navbarNavDropdown a[href="#${section.id}"]`)).toHaveCount(1);

    const content = await target.evaluate((element) => ({
      heading: element.querySelector('h1, h2, h3, h4, h5, h6')?.textContent.trim() || '',
      text: element.textContent.trim(),
    }));

    expect(content.heading, `${section.label} precisa ter um título`).not.toBe('');
    expect(content.text, `${section.label} precisa ter conteúdo`).not.toBe('');
  }
});

test('CT-009 [regression]: troca entre categorias e exibe os cards iniciais', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cardápio', exact: true }).click();

  const categories = ['burgers', 'pizzas', 'churrasco', 'steaks', 'bebidas', 'sobremesas'];
  const cards = page.locator('.card-item');

  for (const category of categories) {
    const categoryButton = page.locator(`#menu-${category}`);
    await expect(categoryButton).toBeVisible();
    await categoryButton.click();
    await expect(categoryButton).toHaveClass(/active/);
    await expect(cards).toHaveCount(8);

    const images = await cards.locator('.img-produto img').all();
    for (const image of images) {
      await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
    }
  }
});

test('CT-010 [regression]: expande a lista sem duplicar produtos', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cardápio', exact: true }).click();
  await page.locator('#menu-pizzas').click();
  const cards = page.locator('.card-item');
  await expect(cards).toHaveCount(8);
  const initialIds = await cards.evaluateAll((elements) => elements.map((element) => element.id));

  const showMore = page.locator('#btnVerMais');
  await page.mouse.wheel(0, 700);
  await expect(showMore).toBeVisible();
  await showMore.click();
  await expect(cards).toHaveCount(12);
  await expect(page.locator('#btnVerMais')).toBeHidden();

  const expandedIds = await cards.evaluateAll((elements) => elements.map((element) => element.id));
  expect(new Set(expandedIds).size).toBe(12);
  expect(expandedIds.slice(0, 8)).toEqual(initialIds);
});

test('CT-011: troca de categoria após expandir reinicia a lista', async ({ page }) => {
  await page.goto('/');
  await page.getByRole('link', { name: 'Cardápio', exact: true }).click();
  await page.locator('#menu-pizzas').click();
  const showMore = page.locator('#btnVerMais');
  await page.mouse.wheel(0, 700);
  await expect(showMore).toBeVisible();
  await showMore.click();
  const expandedPizzaIds = await page.locator('.card-item').evaluateAll((elements) =>
    elements.map((element) => element.id),
  );

  await page.locator('#menu-burgers').click();
  const burgerCards = page.locator('.card-item');
  await expect(burgerCards).toHaveCount(8);
  await expect(page.locator('#btnVerMais')).toBeVisible();
  await expect(page.locator('#menu-burgers')).toHaveClass(/active/);

  const burgerIds = await burgerCards.evaluateAll((elements) => elements.map((element) => element.id));
  expect(burgerIds.some((id) => expandedPizzaIds.includes(id))).toBe(false);
});

test('CT-035: valida integridade estrutural do catálogo local', async () => {
  const fs = require('node:fs');
  const path = require('node:path');
  const vm = require('node:vm');

  const appRoot = path.resolve(__dirname, '..', '..', 'app');
  const dataFile = path.join(appRoot, 'js', 'dados.js');
  const context = {};
  vm.runInNewContext(fs.readFileSync(dataFile, 'utf8'), context, { filename: dataFile });

  const menu = context.MENU;
  expect(menu).toBeTruthy();

  const ids = new Set();
  const violations = [];

  for (const [category, products] of Object.entries(menu)) {
    if (!Array.isArray(products)) {
      violations.push(`${category}: categoria não contém uma lista`);
      continue;
    }

    for (const product of products) {
      if (!product.id || ids.has(product.id)) violations.push(`${category}: id ausente ou duplicado (${product.id})`);
      if (product.id) ids.add(product.id);
      if (typeof product.name !== 'string' || !product.name.trim()) violations.push(`${category}: nome ausente`);
      if (typeof product.price !== 'number' || !Number.isFinite(product.price)) violations.push(`${category}: preço não numérico (${product.id})`);
      if (typeof product.img !== 'string' || !product.img.startsWith('./img/')) {
        violations.push(`${category}: caminho de imagem inválido (${product.id})`);
      } else if (!fs.existsSync(path.resolve(appRoot, product.img))) {
        violations.push(`${category}: arquivo de imagem inexistente (${product.img})`);
      }
    }
  }

  expect(Object.keys(menu).length).toBeGreaterThan(0);
  expect(violations).toEqual([]);
});
