/**
 * Page Object Model: Candidates Page
 */

import { Page, Locator, expect } from '@playwright/test';
import { APPLICATION_STATUSES, VALID_STATUS_TRANSITIONS } from '../fixtures';

export class CandidatesPage {
  readonly page: Page;
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly candidatesList: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly jobFilter: Locator;
  readonly emptyState: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('[data-testid="candidates-page"]');
    this.pageTitle = page.locator('[data-testid="page-title"]');
    this.candidatesList = page.locator('[data-testid="candidates-list"]');
    this.searchInput = page.locator('[data-testid="search-input"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.jobFilter = page.locator('[data-testid="job-filter"]');
    this.emptyState = page.locator('text=Tidak ada kandidat ditemukan');
  }

  async goto() {
    await this.page.goto('/candidates');
    // Wait for page to be visible
    await expect(this.pageContainer).toBeVisible({ timeout: 10000 });
  }

  async getCandidateRow(index: number): Promise<Locator> {
    return this.candidatesList.locator('tbody tr').nth(index);
  }

  async getCandidatesCount(): Promise<number> {
    const rows = this.candidatesList.locator('tbody tr');
    return await rows.count();
  }

  async searchCandidates(query: string) {
    await this.searchInput.fill(query);
    await this.page.waitForTimeout(500); // Debounce
  }

  async filterByStatus(status: typeof APPLICATION_STATUSES[number]) {
    await this.statusFilter.click();
    await this.page.locator(`[data-value="${status}"]`).click();
  }

  async filterByJob(jobTitle: string) {
    await this.jobFilter.click();
    await this.page.getByText(jobTitle).click();
  }

  async clickCandidate(index: number) {
    const row = await this.getCandidateRow(index);
    await row.locator('a').first().click();
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectCandidatesLoaded() {
    // Either we have candidates or empty state
    const hasCandidates = await this.candidatesList.locator('tbody tr').count() > 0;
    const isEmpty = await this.emptyState.isVisible();
    expect(hasCandidates || isEmpty).toBeTruthy();
  }

  async getValidNextStatuses(currentStatus: string): Promise<string[]> {
    return VALID_STATUS_TRANSITIONS[currentStatus] || [];
  }
}
