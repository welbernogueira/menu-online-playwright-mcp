const { test, expect } = require('@playwright/test');

const expectedProducts = [
  { name: 'Gramercy Tavern', price: 'R$ 99,00' },
  { name: 'Shake Shack', price: 'R$ 49,00' },
  { name: "Gott's Roadside", price: 'R$ 99,00' },
  { name: 'Emmy Squared', price: 'R$ 99,00' },
  { name: 'Shake Shack', price: 'R$ 89,00' },
  { name: 'Peter Luger Steak House', price: 'R$ 175,95' },
  { name: 'Holeman and Finch', price: 'R$ 79,00' },
  { name: 'Pat LaFrieda Meats', price: 'R$ 109,00' },
];

test('CT-005: mantém os oito produtos visíveis com nomes, preços e imagens carregadas', async ({ page }) => {
  await page.goto('/');

  const cards = page.locator('.card-item');
  await expect(cards).toHaveCount(expectedProducts.length);

  for (const [index, product] of expectedProducts.entries()) {
    const card = cards.nth(index);
    await expect(card.locator('.title-produto')).toHaveText(product.name);
    await expect(card.locator('.price-produto')).toHaveText(product.price);

    const image = card.locator('.img-produto img');
    await expect(image).toBeVisible();
    await expect.poll(() => image.evaluate((element) => element.naturalWidth)).toBeGreaterThan(0);
  }
});
