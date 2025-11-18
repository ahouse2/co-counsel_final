import { test, expect } from '@playwright/test';

test('Halo flow end-to-end: home -> graph -> submodule -> viewport', async ({ page }) => {
  await page.goto('/');
  const haloInterface = page.locator('.halo-interface');
  await expect(haloInterface).toBeVisible();

  // Open the first primary module (left side)
  const firstModule = page.locator('.halo-node').first();
  await expect(firstModule).toBeVisible();
  await firstModule.click();

  // Ensure submodules are shown and interact with the first submodule
  const firstSub = page.locator('.halo-subnode').first();
  await expect(firstSub).toBeVisible();
  await firstSub.click();

  // Navigate to a graph viewport to ensure central viewport updates
  await page.goto('/graph');
  const core = page.locator('.halo-core');
  await expect(core).toBeVisible();
});
