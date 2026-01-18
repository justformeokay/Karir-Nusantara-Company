/**
 * Page Object Model: Jobs Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class JobsPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly createJobButton: Locator;
  readonly jobsList: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  readonly pagination: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.createJobButton = page.locator('[data-testid="create-job-button"]');
    this.jobsList = page.locator('[data-testid="jobs-list"]');
    this.searchInput = page.locator('input[placeholder*="Search"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.loadingState = page.locator('[data-testid="loading-state"]');
    this.pagination = page.locator('[data-testid="pagination"]');
  }

  async goto() {
    await this.page.goto('/jobs');
    await expect(this.pageTitle).toContainText('Lowongan');
  }

  async clickCreateJob() {
    await this.createJobButton.click();
    await this.page.waitForURL('/jobs/new');
  }

  async getJobCard(index: number): Promise<Locator> {
    return this.jobsList.locator('[data-testid="job-card"]').nth(index);
  }

  async getJobsCount(): Promise<number> {
    const cards = this.jobsList.locator('[data-testid="job-card"]');
    return await cards.count();
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
    const card = await this.getJobCard(index);
    await card.click();
  }

  async openJobMenu(index: number) {
    const card = await this.getJobCard(index);
    await card.locator('[data-testid="job-menu"]').click();
  }

  async closeJob(index: number) {
    await this.openJobMenu(index);
    await this.page.locator('[data-testid="close-job"]').click();
    // Confirm dialog
    await this.page.locator('[data-testid="confirm-button"]').click();
  }

  async pauseJob(index: number) {
    await this.openJobMenu(index);
    await this.page.locator('[data-testid="pause-job"]').click();
  }

  async reopenJob(index: number) {
    await this.openJobMenu(index);
    await this.page.locator('[data-testid="reopen-job"]').click();
  }

  async deleteJob(index: number) {
    await this.openJobMenu(index);
    await this.page.locator('[data-testid="delete-job"]').click();
    // Confirm dialog
    await this.page.locator('[data-testid="confirm-button"]').click();
  }

  async expectJobStatus(index: number, status: string) {
    const card = await this.getJobCard(index);
    const statusBadge = card.locator('[data-testid="job-status"]');
    await expect(statusBadge).toContainText(status);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectJobsLoaded() {
    await expect(this.loadingState).not.toBeVisible();
    // Either jobs list or empty state should be visible
    const hasJobs = await this.jobsList.isVisible();
    const isEmpty = await this.emptyState.isVisible();
    expect(hasJobs || isEmpty).toBeTruthy();
  }
}
