/**
 * Page Object Model: Dashboard Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly activeJobsCard: Locator;
  readonly totalApplicantsCard: Locator;
  readonly underReviewCard: Locator;
  readonly acceptedCard: Locator;
  readonly recentApplicantsList: Locator;
  readonly activeJobsList: Locator;
  readonly createJobButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('[data-testid="dashboard-page"]');
    this.pageTitle = page.locator('[data-testid="page-title"]');
    this.activeJobsCard = page.locator('[data-testid="stat-active-jobs"]');
    this.totalApplicantsCard = page.locator('[data-testid="stat-total-applicants"]');
    this.underReviewCard = page.locator('[data-testid="stat-under-review"]');
    this.acceptedCard = page.locator('[data-testid="stat-accepted"]');
    this.recentApplicantsList = page.locator('[data-testid="recent-applicants"]');
    this.activeJobsList = page.locator('[data-testid="active-jobs"]');
    this.createJobButton = page.locator('[data-testid="create-job-button"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
    // Wait for the dashboard page to be visible
    await expect(this.pageContainer).toBeVisible({ timeout: 10000 });
  }

  async expectStatsLoaded() {
    await expect(this.activeJobsCard).toBeVisible({ timeout: 10000 });
    await expect(this.totalApplicantsCard).toBeVisible({ timeout: 10000 });
    await expect(this.underReviewCard).toBeVisible({ timeout: 10000 });
    await expect(this.acceptedCard).toBeVisible({ timeout: 10000 });
  }

  async getActiveJobsCount(): Promise<number> {
    const text = await this.activeJobsCard.locator('[data-testid="stat-value"]').textContent();
    return parseInt(text || '0', 10);
  }

  async getTotalApplicantsCount(): Promise<number> {
    const text = await this.totalApplicantsCard.locator('[data-testid="stat-value"]').textContent();
    return parseInt(text || '0', 10);
  }

  async clickCreateJob() {
    await this.createJobButton.click();
    await this.page.waitForURL('/jobs/new');
  }

  async clickRecentApplicant(index: number) {
    const applicants = this.recentApplicantsList.locator('[data-testid="applicant-card"]');
    await applicants.nth(index).click();
  }

  async clickActiveJob(index: number) {
    const jobs = this.activeJobsList.locator('a');
    await jobs.nth(index).click();
  }
}
