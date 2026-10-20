// @ts-check
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { SidebarPage } from './pages/SidebarPage.js';

// Log in before every test in this suite
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('demo', 'demo123');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test.describe('Navigation', () => {

  test('sidebar renders all 5 navigation tabs', async ({ page }) => {
    const sidebar = new SidebarPage(page);
    await sidebar.expectAllTabsVisible();
    // Sign Out is also present
    await expect(sidebar.signOutButton).toBeVisible();
  });

  test('each tab navigates to the correct page', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    // Expenses
    await sidebar.navigateTo('expenses');
    await expect(page.getByRole('heading', { name: 'Expenses' })).toBeVisible();

    // Investments
    await sidebar.navigateTo('investments');
    await expect(page.getByRole('heading', { name: 'Investments' })).toBeVisible();

    // Budgets
    await sidebar.navigateTo('budgets');
    await expect(page.getByRole('heading', { name: 'Budgets' })).toBeVisible();

    // Settings
    await sidebar.navigateTo('settings');
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();

    // Back to Dashboard
    await sidebar.navigateTo('dashboard');
    await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
  });

  test('active tab is highlighted with the emerald style', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    // Dashboard is active by default after login
    const dashboardBtn = sidebar.dashboardTab;
    await expect(dashboardBtn).toHaveClass(/text-emerald-400/);

    // Switch to Expenses — that button should now be highlighted
    await sidebar.navigateTo('expenses');
    const expensesBtn = sidebar.expensesTab;
    await expect(expensesBtn).toHaveClass(/text-emerald-400/);
    // Dashboard is no longer highlighted
    await expect(dashboardBtn).not.toHaveClass(/text-emerald-400/);
  });

  test('sidebar collapses and expands', async ({ page }) => {
    const sidebar = new SidebarPage(page);

    // Initially expanded
    await sidebar.expectExpanded();

    // Collapse it
    await sidebar.collapse();
    await sidebar.expectCollapsed();

    // Expand it again via the icon button
    await sidebar.expand();
    await sidebar.expectExpanded();
  });

  test('avatar button in top bar navigates to Settings', async ({ page }) => {
    // The avatar shows initials "AM" for Alex Morgan; it's in the top bar
    const avatarButton = page.getByRole('button', { name: 'AM' });
    await avatarButton.click();
    await expect(page.getByRole('heading', { name: 'Settings' })).toBeVisible();
  });

});
