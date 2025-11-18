import { test, expect } from '@playwright/test';

test('Halo UI loads on Home and Graph path', async ({ page }) => {
  // Start at home route (assuming Vite dev server or prebuilt app serves root)
  await page.goto('/');
  // Expect halo interface to render
  const halo = await page.locator('.halo-interface');
  await expect(halo).toBeVisible();
  // Verify left module nodes exist
  const leftNodes = await page.locator('.halo-node');
  await expect(leftNodes.first()).toBeVisible();
  // Click first module to trigger viewport changes
  await leftNodes.first().click();
  // Navigate to Graph route and verify center viewport appears
  await page.goto('/graph');
  const center = await page.locator('.halo-core');
  await expect(center).toBeVisible();
});
