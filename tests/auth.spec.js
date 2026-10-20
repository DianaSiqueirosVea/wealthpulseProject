// @ts-check
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';

test.describe('Authentication', () => {

  test('valid login redirects to Dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('demo', 'demo123');

    // After a successful login the Overview heading is visible
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('invalid credentials shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('wrong', 'wrongpass');

    await loginPage.expectError();
    // Must stay on the login screen
    await loginPage.expectStillOnLogin();
  });

  test('wrong password only shows error message', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('demo', 'badpassword');

    await loginPage.expectError();
    await loginPage.expectStillOnLogin();
  });

  test('empty fields do not navigate away', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Click Sign In without filling any fields
    await loginPage.signInButton.click();

    await loginPage.expectError();
    await loginPage.expectStillOnLogin();
  });

  test('pressing Enter in the password field submits the form', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginWithEnter('demo', 'demo123');

    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('credentials hint is visible on the login screen', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // The hint text "demo / demo123" appears at the bottom of the card
    await expect(page.getByText('Credentials:')).toBeVisible();
  });

  test('logout returns to the login screen', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login('demo', 'demo123');

    // Confirm we are on the dashboard
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();

    // Click Sign Out from the sidebar
    await page.getByRole('button', { name: 'Sign Out' }).click();

    // The login screen should be shown again
    await loginPage.expectVisible();
  });

});
