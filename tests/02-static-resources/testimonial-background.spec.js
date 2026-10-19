const { test, expect } = require('@playwright/test');
const { collectHttpResponses, attachJson } = require('../support/known-issues');

test('CT-003 acceptance: não solicita /img e mantém os elementos dos depoimentos carregados', async ({ page }, testInfo) => {
  const responses = collectHttpResponses(page);
  await page.goto('/');

  const background = await page.locator('.background-depoimentos').evaluate((element) => ({
    computed: getComputedStyle(element).backgroundImage,
  }));
  const card = await page.locator('.card-depoimentos').evaluate((element) => {
    const style = getComputedStyle(element);
    return {
      width: style.width,
      height: style.height,
      borderRadius: style.borderRadius,
      backgroundColor: style.backgroundColor,
      position: style.position,
      left: style.left,
    };
  });
  const pizzaImage = page.locator('.depoimentos .img-banner img');
  await expect.poll(() => pizzaImage.evaluate((image) => image.naturalWidth)).toBeGreaterThan(0);
  const pizza = await pizzaImage.evaluate((image) => ({
    src: image.currentSrc,
    complete: image.complete,
    naturalWidth: image.naturalWidth,
  }));
  const invalidRequests = responses.filter((response) => new URL(response.url).pathname === '/img');
  const pizzaResponse = responses.find((response) => response.url === pizza.src);

  await attachJson(testInfo, 'ct-003-background-baseline.json', {
    background,
    card,
    invalidRequests,
    pizza,
    pizzaResponse,
  });

  expect(background.computed, 'fundo sem imagem definida não deve disparar requisição inválida').toBe('none');
  expect(invalidRequests, 'a página não deve solicitar o diretório /img como imagem').toEqual([]);
  expect(card).toEqual({
    width: '390px',
    height: '390px',
    borderRadius: '120px',
    backgroundColor: 'rgb(255, 232, 163)',
    position: 'absolute',
    left: '0px',
  });
  expect(pizza.naturalWidth, 'a imagem de pizzas deve carregar').toBeGreaterThan(0);
  expect(pizzaResponse, `requisição observada para ${pizza.src}`).toBeDefined();
  expect(pizzaResponse.status, `${pizza.src} deve responder sem erro HTTP`).toBeLessThan(400);
});
