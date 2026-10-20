// @ts-check
import { expect } from '@playwright/test';

/**
 * SidebarPage — encapsulates selectors and actions for the sidebar navigation.
 */
export class SidebarPage {
  constructor(page) {
    this.page = page;

    // Nav tab buttons
    this.dashboardTab = page.getByRole('button', { name: 'Dashboard' });
    this.expensesTab = page.getByRole('button', { name: 'Expenses' });
    this.investmentsTab = page.getByRole('button', { name: 'Investments' });
    this.budgetsTab = page.getByRole('button', { name: 'Budgets' });
    this.settingsTab = page.getByRole('button', { name: 'Settings' });
    this.collapseButton = page.getByRole('button', { name: 'Collapse' });
    this.signOutButton = page.getByRole('button', { name: 'Sign Out' });

    // Sidebar element (to check collapsed width)
    this.sidebar = page.locator('aside');
  }

  /** Click a tab by its id string: 'dashboard' | 'expenses' | 'investments' | 'budgets' | 'settings' */
  async navigateTo(tab) {
    const map = {
      dashboard: this.dashboardTab,
      expenses: this.expensesTab,
      investments: this.investmentsTab,
      budgets: this.budgetsTab,
      settings: this.settingsTab,
    };
    await map[tab].click();
  }

  /** Assert all 5 nav tabs are visible */
  async expectAllTabsVisible() {
    await expect(this.dashboardTab).toBeVisible();
    await expect(this.expensesTab).toBeVisible();
    await expect(this.investmentsTab).toBeVisible();
    await expect(this.budgetsTab).toBeVisible();
    await expect(this.settingsTab).toBeVisible();
  }

  /** Collapse the sidebar */
  async collapse() {
    await this.collapseButton.click();
  }

  /** Expand the sidebar (after it's been collapsed — button no longer shows text) */
  async expand() {
    // After collapse, the icon-only button is still the same element
    await this.sidebar.locator('button').filter({ has: this.page.locator('svg') }).first().click();
  }

  /** Assert sidebar is expanded (shows label text) */
  async expectExpanded() {
    await expect(this.page.getByText('Dashboard')).toBeVisible();
    await expect(this.sidebar).toHaveClass(/w-60/);
  }

  /** Assert sidebar is collapsed (labels hidden, narrow width) */
  async expectCollapsed() {
    await expect(this.sidebar).toHaveClass(/w-\[68px\]/);
  }

  /** Click Sign Out */
  async signOut() {
    await this.signOutButton.click();
  }
}
