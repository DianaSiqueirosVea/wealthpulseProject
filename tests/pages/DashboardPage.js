// @ts-check
import { expect } from '@playwright/test';

/**
 * DashboardPage — encapsulates selectors and assertions for the Dashboard (Overview) tab.
 */
export class DashboardPage {
  constructor(page) {
    this.page = page;

    // Heading
    this.heading = page.getByRole('heading', { name: 'Overview' });

    // Month selector buttons
    this.janButton = page.getByRole('button', { name: 'Jan' });
    this.febButton = page.getByRole('button', { name: 'Feb' });
    this.marButton = page.getByRole('button', { name: 'Mar' });

    // KPI stat cards (located by their label text)
    this.incomeCard = page.getByText('Monthly Income').first();
    this.totalSpentCard = page.getByText('Total Spent').first();
    this.netSavingsCard = page.getByText('Net Savings').first();
    this.transactionsCard = page.getByText('Transactions').first();

    // Chart section headings
    this.spendingByCategoryHeading = page.getByText('Spending by Category');
    this.cumulativeSpendingHeading = page.getByText('Cumulative Spending');
    this.monthlyComparisonHeading = page.getByText('Monthly Comparison');

    // Budget alerts section
    this.budgetAlertsHeading = page.getByText('Budget Alerts');

    // Recent transactions section
    this.recentTransactionsHeading = page.getByText('Recent Transactions');
  }

  /** Assert the dashboard heading is visible */
  async expectVisible() {
    await expect(this.heading).toBeVisible();
  }

  /** Assert all 4 KPI stat cards are visible */
  async expectKpiCardsVisible() {
    await expect(this.incomeCard).toBeVisible();
    await expect(this.totalSpentCard).toBeVisible();
    await expect(this.netSavingsCard).toBeVisible();
    await expect(this.transactionsCard).toBeVisible();
  }

  /** Click a month by short name: 'Jan' | 'Feb' | 'Mar' */
  async selectMonth(month) {
    const map = { Jan: this.janButton, Feb: this.febButton, Mar: this.marButton };
    await map[month].click();
  }

  /** Assert the spending donut chart is visible */
  async expectDonutChartVisible() {
    await expect(this.spendingByCategoryHeading).toBeVisible();
    // Recharts renders SVG — assert the container is present
    await expect(this.page.locator('.recharts-pie')).toBeVisible();
  }

  /** Assert the cumulative area chart is visible */
  async expectAreaChartVisible() {
    await expect(this.cumulativeSpendingHeading).toBeVisible();
    await expect(this.page.locator('.recharts-area')).toBeVisible();
  }

  /** Assert the monthly comparison bar chart is visible */
  async expectBarChartVisible() {
    await expect(this.monthlyComparisonHeading).toBeVisible();
    await expect(this.page.locator('.recharts-bar').first()).toBeVisible();
  }

  /** Assert at least one budget alert card is visible */
  async expectBudgetAlertsVisible() {
    await expect(this.budgetAlertsHeading).toBeVisible();
  }

  /** Assert at least one recent transaction row is present */
  async expectRecentTransactionsVisible() {
    await expect(this.recentTransactionsHeading).toBeVisible();
    // Each row has a category icon + description + amount
    await expect(this.page.locator('text=-$').first()).toBeVisible();
  }

  /**
   * Get the text content of a KPI value cell by its label.
   * Useful for asserting month switching changes values.
   */
  async getKpiValue(label) {
    // The KPI structure: label in a <p>, value in the next sibling <p>
    const card = this.page.locator(`p:has-text("${label}")`).first();
    return card.locator('..').locator('p.text-xl').textContent();
  }
}
