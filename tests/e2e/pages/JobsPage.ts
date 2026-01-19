/**
 * Page Object Model: Jobs Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class JobsPage {
  readonly page: Page;
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly createJobButton: Locator;
  readonly jobsList: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('[data-testid="jobs-page"]');
    this.pageTitle = page.locator('[data-testid="page-title"]');
    this.createJobButton = page.locator('[data-testid="create-job-button"]');
    this.jobsList = page.locator('[data-testid="jobs-list"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.emptyState = page.locator('text=Tidak ada lowongan');
  }

  async goto() {
    await this.page.goto('/jobs');
    await expect(this.pageContainer).toBeVisible({ timeout: 10000 });
  }

  async clickCreateJob() {
    await this.createJobButton.click();
    await this.page.waitForURL('/jobs/new');
  }

  async getJobRow(index: number): Promise<Locator> {
    return this.jobsList.locator('tbody tr').nth(index);
  }

  async getJobsCount(): Promise<number> {
    const rows = this.jobsList.locator('tbody tr');
    return await rows.count();
  }

  async searchJobs(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByStatus(status: string) {
    await this.statusFilter.click();
    await this.page.locator(`[data-value="${status}"]`).click();
  }

  async clickJob(index: number) {
    const row = await this.getJobRow(index);
    await row.locator('a').first().click();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectJobsLoaded() {
    // Either jobs list or empty state should be visible
    const hasJobs = await this.jobsList.locator('tbody tr').count() > 0;
    const isEmpty = await this.emptyState.isVisible();
    expect(hasJobs || isEmpty).toBeTruthy();
  }
}
