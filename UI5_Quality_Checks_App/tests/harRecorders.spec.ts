import { test, expect } from '@playwright/test';

let githubToken="DUMMY"; // <-- Enter your correct github token here

test('App Login Test HAR File Recorder', async ({ page }) => {

  test.setTimeout(120000);
  // Get the response from the HAR file
  await page.routeFromHAR('./hars/gogogadget.har', {
    url: 'https://api.github.com/**/*',
    update: true,
  });

  await page.goto('/');
  await page.getByPlaceholder('GitHub Access Token').fill(githubToken);
  await page.getByRole('button', { name: 'Go go gadget' }).click();

  await expect(page.getByText('GPI_Tools_App')).toBeVisible({ timeout: 25000 });
});