// @ts-check
import { test, expect } from '@playwright/test';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';

// Log in and land on the dashboard before every test
test.beforeEach(async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('demo', 'demo123');
  await expect(page.getByRole('heading', { name: 'Overview' })).toBeVisible();
});

test.describe('Dashboard', () => {

  test('KPI cards render with non-empty values', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    await dashboard.expectKpiCardsVisible();

    // Monthly Income should show $6,500.00 (seeded constant)
    await expect(page.getByText('$6,500.00')).toBeVisible();

    // Total Spent and Net Savings should be present as currency values
    await expect(page.locator('p.text-xl').filter({ hasText: /^\$[\d,]+\.\d{2}$/ }).first()).toBeVisible();
  });

  test('switching months updates KPI values', async ({ page }) => {
    const dashboard = new DashboardPage(page);

    // Default is March — capture the Transactions count
    const marchTransactions = await page.locator('p.text-xl').nth(3).textContent();

    // Switch to January
    await dashboard.selectMonth('Jan');
    const janTransactions = await page.locator('p.text-xl').nth(3).textContent();

    // Transaction counts differ between months (seeded data guarantees this)
    expect(marchTransactions).not.toBe(janTransactions);

    // Switch to February
    await dashboard.selectMonth('Feb');
    const febTransactions = await page.locator('p.text-xl').nth(3).textContent();
    expect(marchTransactions).not.toBe(febTransactions);
  });

  test('spending by category donut chart renders', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectDonutChartVisible();

    // At least one category legend label should be visible below the chart
    await expect(page.getByText('Housing').first()).toBeVisible();
  });

  test('cumulative spending area chart renders', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectAreaChartVisible();
  });

  test('monthly comparison bar chart renders', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectBarChartVisible();

    // Jan / Feb / Mar axis labels should be present
    await expect(page.getByText('Jan').first()).toBeVisible();
    await expect(page.getByText('Feb').first()).toBeVisible();
    await expect(page.getByText('Mar').first()).toBeVisible();
  });

  test('budget alerts section is visible with at least one alert', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectBudgetAlertsVisible();

    // There should be at least one category budget alert card
    // Alerts show category name + "$X.XX / $Y.ZZ" spending text
    await expect(page.locator('text=/\\$[\\d,]+\\.\\d{2} \\/ \\$[\\d,]+\\.\\d{2}/').first()).toBeVisible();
  });

  test('recent transactions list shows at least one entry', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.expectRecentTransactionsHeading.toBeVisible();

    // Each row shows a description and a negative amount
    const rows = page.locator('text=/-\\$[\\d,]+\\.\\d{2}/');
    await expect(rows.first()).toBeVisible();
    expect(await rows.count()).toBeGreaterThan(0);
  });

});
