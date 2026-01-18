/**
 * Page Object Model: Dashboard Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class DashboardPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly activeJobsCard: Locator;
  readonly totalApplicantsCard: Locator;
  readonly underReviewCard: Locator;
  readonly acceptedCard: Locator;
  readonly recentApplicantsList: Locator;
  readonly activeJobsList: Locator;
  readonly quotaDisplay: Locator;
  readonly verificationBanner: Locator;
  readonly createJobButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.activeJobsCard = page.locator('[data-testid="stat-active-jobs"]');
    this.totalApplicantsCard = page.locator('[data-testid="stat-total-applicants"]');
    this.underReviewCard = page.locator('[data-testid="stat-under-review"]');
    this.acceptedCard = page.locator('[data-testid="stat-accepted"]');
    this.recentApplicantsList = page.locator('[data-testid="recent-applicants"]');
    this.activeJobsList = page.locator('[data-testid="active-jobs"]');
    this.quotaDisplay = page.locator('[data-testid="quota-display"]');
    this.verificationBanner = page.locator('[data-testid="verification-banner"]');
    this.createJobButton = page.locator('[data-testid="create-job-button"]');
  }

  async goto() {
    await this.page.goto('/dashboard');
    await expect(this.pageTitle).toContainText('Dashboard');
  }

  async expectStatsLoaded() {
    await expect(this.activeJobsCard).toBeVisible();
    await expect(this.totalApplicantsCard).toBeVisible();
    await expect(this.underReviewCard).toBeVisible();
    await expect(this.acceptedCard).toBeVisible();
  }

  async getActiveJobsCount(): Promise<number> {
    const text = await this.activeJobsCard.locator('[data-testid="stat-value"]').textContent();
    return parseInt(text || '0', 10);
  }

  async getTotalApplicantsCount(): Promise<number> {
    const text = await this.totalApplicantsCard.locator('[data-testid="stat-value"]').textContent();
    return parseInt(text || '0', 10);
  }

  async expectVerificationBanner(status: 'pending' | 'rejected') {
    await expect(this.verificationBanner).toBeVisible();
    if (status === 'pending') {
      await expect(this.verificationBanner).toContainText('pending');
    } else {
      await expect(this.verificationBanner).toContainText('rejected');
    }
  }

  async expectNoVerificationBanner() {
    await expect(this.verificationBanner).not.toBeVisible();
  }

  async clickCreateJob() {
    await this.createJobButton.click();
    await this.page.waitForURL('/jobs/new');
  }

  async clickRecentApplicant(index: number) {
    const applicants = this.recentApplicantsList.locator('[data-testid="applicant-item"]');
    await applicants.nth(index).click();
  }

  async clickActiveJob(index: number) {
    const jobs = this.activeJobsList.locator('[data-testid="job-item"]');
    await jobs.nth(index).click();
  }

  async getQuotaText(): Promise<string> {
    return await this.quotaDisplay.textContent() || '';
  }
}
