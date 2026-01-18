/**
 * Page Object Model: Candidates Page
 */

import { Page, Locator, expect } from '@playwright/test';
import { APPLICATION_STATUSES, VALID_STATUS_TRANSITIONS } from '../fixtures';

export class CandidatesPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly candidatesList: Locator;
  readonly searchInput: Locator;
  readonly statusFilter: Locator;
  readonly jobFilter: Locator;
  readonly emptyState: Locator;
  readonly loadingState: Locator;
  readonly pagination: Locator;
  readonly bulkActionsMenu: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.candidatesList = page.locator('[data-testid="candidates-list"]');
    this.searchInput = page.locator('input[placeholder*="Cari"]');
    this.statusFilter = page.locator('[data-testid="status-filter"]');
    this.jobFilter = page.locator('[data-testid="job-filter"]');
    this.emptyState = page.locator('[data-testid="empty-state"]');
    this.loadingState = page.locator('[data-testid="loading-state"]');
    this.pagination = page.locator('[data-testid="pagination"]');
    this.bulkActionsMenu = page.locator('[data-testid="bulk-actions"]');
  }

  async goto() {
    await this.page.goto('/candidates');
    await expect(this.pageTitle).toContainText('Kandidat');
  }

  async getCandidateCard(index: number): Promise<Locator> {
    return this.candidatesList.locator('[data-testid="candidate-card"]').nth(index);
  }

  async getCandidatesCount(): Promise<number> {
    const cards = this.candidatesList.locator('[data-testid="candidate-card"]');
    return await cards.count();
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
    await this.page.locator(`text=${jobTitle}`).click();
  }

  async clickCandidate(index: number) {
    const card = await this.getCandidateCard(index);
    await card.click();
  }

  async openCandidateMenu(index: number) {
    const card = await this.getCandidateCard(index);
    await card.locator('[data-testid="candidate-menu"]').click();
  }

  async updateCandidateStatus(index: number, newStatus: string) {
    await this.openCandidateMenu(index);
    await this.page.locator(`[data-testid="status-${newStatus}"]`).click();
  }

  async expectCandidateStatus(index: number, status: string) {
    const card = await this.getCandidateCard(index);
    const statusBadge = card.locator('[data-testid="candidate-status"]');
    await expect(statusBadge).toContainText(status);
  }

  async expectEmptyState() {
    await expect(this.emptyState).toBeVisible();
  }

  async expectCandidatesLoaded() {
    await expect(this.loadingState).not.toBeVisible();
    const hasCandidates = await this.candidatesList.isVisible();
    const isEmpty = await this.emptyState.isVisible();
    expect(hasCandidates || isEmpty).toBeTruthy();
  }

  async getValidNextStatuses(currentStatus: string): Promise<string[]> {
    return VALID_STATUS_TRANSITIONS[currentStatus] || [];
  }
}
