import { test, expect } from '@playwright/test';

test('App Login Test', async ({ page }) => {
  // Set the test timeout
  test.setTimeout(120000);

  // Mock the network requests to the github api
  await page.routeFromHAR('./hars/gogogadget.har', {
    url: 'https://api.github.com/**/*',
    update: false,
  });

  // Go to the startpage of the app
  await page.goto('/');

  // Fille in the github token into the token field
  await page.getByPlaceholder('GitHub Access Token').fill('dummytoken');

  // Press the go go gadget button to login
  await page.getByRole('button', { name: 'Go go gadget' }).click();

  // Check if the list contains an entry with the provided name in a certain time
  await expect(page.getByText('GPI_Tools_App')).toBeVisible({ timeout: 25000 });

});



