import { test, expect } from '@playwright/test';

test('test', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.getByRole('button', { name: 'Add to Cart' }).nth(1).click();
  await page.getByRole('button', { name: 'Add to Cart' }).nth(2).click();
  await page.getByRole('button', { name: 'Add to Cart' }).nth(3).click();
  await page.getByText('🛍️').click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('name here');
  await page.getByRole('textbox', { name: 'Full Name *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email *' }).fill('email@email.com');
  await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Shipping Address *' }).fill('this is an address');

  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/events') && resp.status() === 202),
    page.getByRole('button', { name: 'Place Order' }).click()
  ]);

  expect(response.status()).toBe(202);

  await expect(page.getByRole('heading', { name: '✓ Order Placed Successfully!' })).toBeVisible();
});

test('test1', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.getByRole('button', { name: 'Add to Cart' }).nth(1).click();
  await page.getByRole('button', { name: 'Add to Cart' }).nth(2).click();
  await page.getByText('🛍️').click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('name here');
  await page.getByRole('textbox', { name: 'Full Name *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email *' }).fill('email@email.com');
  await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Shipping Address *' }).fill('this is an address');

  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/events') && resp.status() === 202),
    page.getByRole('button', { name: 'Place Order' }).click()
  ]);

  expect(response.status()).toBe(202);

  await expect(page.getByRole('heading', { name: '✓ Order Placed Successfully!' })).toBeVisible();
});

test('test2', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.getByRole('button', { name: 'Add to Cart' }).nth(1).click();
  await page.getByText('🛍️').click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('name here');
  await page.getByRole('textbox', { name: 'Full Name *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email *' }).fill('email@email.com');
  await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Shipping Address *' }).fill('this is an address');

  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/events') && resp.status() === 202),
    page.getByRole('button', { name: 'Place Order' }).click()
  ]);

  expect(response.status()).toBe(202);

  await expect(page.getByRole('heading', { name: '✓ Order Placed Successfully!' })).toBeVisible();
});


test('test3', async ({ page }) => {
  await page.goto('http://localhost:3000/');

  await page.getByRole('button', { name: 'Add to Cart' }).nth(2).click();
  await page.getByText('🛍️').click();
  await page.getByRole('button', { name: 'Proceed to Checkout' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).click();
  await page.getByRole('textbox', { name: 'Full Name *' }).fill('name here');
  await page.getByRole('textbox', { name: 'Full Name *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Email *' }).fill('email@email.com');
  await page.getByRole('textbox', { name: 'Email *' }).press('Tab');
  await page.getByRole('textbox', { name: 'Shipping Address *' }).fill('this is an address');

  const [response] = await Promise.all([
    page.waitForResponse(resp => resp.url().includes('/events') && resp.status() === 202),
    page.getByRole('button', { name: 'Place Order' }).click()
  ]);

  expect(response.status()).toBe(202);

  await expect(page.getByRole('heading', { name: '✓ Order Placed Successfully!' })).toBeVisible();
});