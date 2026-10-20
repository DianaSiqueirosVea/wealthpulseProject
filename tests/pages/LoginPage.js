// @ts-check
import { expect } from '@playwright/test';

/**
 * LoginPage — encapsulates all selectors and actions on the login screen.
 */
export class LoginPage {
  constructor(page) {
    this.page = page;

    // Locators
    this.usernameInput = page.getByPlaceholder('demo').first();
    this.passwordInput = page.getByPlaceholder('demo123');
    this.signInButton = page.getByRole('button', { name: 'Sign In' });
    this.errorMessage = page.getByText('Invalid credentials. Use demo / demo123');
    this.credentialsHint = page.getByText('demo / demo123');
  }

  /** Navigate to the app root */
  async goto() {
    await this.page.goto('/');
  }

  /** Fill in credentials and click Sign In */
  async login(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.signInButton.click();
  }

  /** Fill in credentials and submit with Enter key */
  async loginWithEnter(username, password) {
    await this.usernameInput.fill(username);
    await this.passwordInput.fill(password);
    await this.passwordInput.press('Enter');
  }

  /** Assert the login page is visible */
  async expectVisible() {
    await expect(this.page.getByRole('heading', { name: 'WealthPulse' })).toBeVisible();
    await expect(this.signInButton).toBeVisible();
  }

  /** Assert the error message is visible */
  async expectError() {
    await expect(this.errorMessage).toBeVisible();
  }

  /** Assert no navigation occurred (still on login) */
  async expectStillOnLogin() {
    await expect(this.signInButton).toBeVisible();
  }
}
