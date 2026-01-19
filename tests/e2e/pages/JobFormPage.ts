/**
 * Page Object Model: Job Form Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class JobFormPage {
  readonly page: Page;
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly form: Locator;
  readonly titleInput: Locator;
  readonly categorySelect: Locator;
  readonly typeSelect: Locator;
  readonly saveDraftButton: Locator;
  readonly publishButton: Locator;
  readonly cancelButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('[data-testid="job-form-page"]');
    this.pageTitle = page.locator('[data-testid="page-title"]');
    this.form = page.locator('[data-testid="job-form"]');
    this.titleInput = page.locator('[data-testid="job-title-input"]');
    this.categorySelect = page.locator('[data-testid="job-category-select"]');
    this.typeSelect = page.locator('[data-testid="job-type-select"]');
    this.saveDraftButton = page.locator('[data-testid="save-draft-button"]');
    this.publishButton = page.locator('[data-testid="publish-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
  }

  async gotoNew() {
    await this.page.goto('/jobs/new');
    await expect(this.pageContainer).toBeVisible({ timeout: 10000 });
  }

  async gotoEdit(jobId: string) {
    await this.page.goto(`/jobs/${jobId}/edit`);
    await expect(this.pageContainer).toBeVisible({ timeout: 10000 });
  }

  async fillTitle(title: string) {
    await this.titleInput.fill(title);
  }

  async selectCategory(category: string) {
    await this.categorySelect.click();
    await this.page.getByText(category).click();
  }

  async selectType(type: string) {
    await this.typeSelect.click();
    await this.page.getByText(type).click();
  }

  async saveDraft() {
    await this.saveDraftButton.click();
  }

  async publish() {
    await this.publishButton.click();
  }

  async cancel() {
    await this.cancelButton.click();
  }

  async expectFormVisible() {
    await expect(this.form).toBeVisible({ timeout: 10000 });
  }
}
