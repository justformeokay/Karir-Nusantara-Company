/**
 * Page Object Model: Job Form Page
 */

import { Page, Locator, expect } from '@playwright/test';
import { createTestJob } from '../fixtures';

export class JobFormPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly titleInput: Locator;
  readonly descriptionEditor: Locator;
  readonly requirementsEditor: Locator;
  readonly locationInput: Locator;
  readonly typeSelect: Locator;
  readonly experienceSelect: Locator;
  readonly salaryMinInput: Locator;
  readonly salaryMaxInput: Locator;
  readonly salaryCurrencySelect: Locator;
  readonly salaryVisibleCheckbox: Locator;
  readonly skillsInput: Locator;
  readonly benefitsInput: Locator;
  readonly saveDraftButton: Locator;
  readonly publishButton: Locator;
  readonly cancelButton: Locator;
  readonly errorMessages: Locator;
  readonly quotaWarning: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.titleInput = page.locator('input[name="title"]');
    this.descriptionEditor = page.locator('[data-testid="description-editor"]');
    this.requirementsEditor = page.locator('[data-testid="requirements-editor"]');
    this.locationInput = page.locator('input[name="location"]');
    this.typeSelect = page.locator('[data-testid="type-select"]');
    this.experienceSelect = page.locator('[data-testid="experience-select"]');
    this.salaryMinInput = page.locator('input[name="salary_min"]');
    this.salaryMaxInput = page.locator('input[name="salary_max"]');
    this.salaryCurrencySelect = page.locator('[data-testid="currency-select"]');
    this.salaryVisibleCheckbox = page.locator('input[name="is_salary_visible"]');
    this.skillsInput = page.locator('[data-testid="skills-input"]');
    this.benefitsInput = page.locator('[data-testid="benefits-input"]');
    this.saveDraftButton = page.locator('[data-testid="save-draft"]');
    this.publishButton = page.locator('[data-testid="publish-button"]');
    this.cancelButton = page.locator('[data-testid="cancel-button"]');
    this.errorMessages = page.locator('[data-testid="field-error"]');
    this.quotaWarning = page.locator('[data-testid="quota-warning"]');
  }

  async gotoNew() {
    await this.page.goto('/jobs/new');
    await expect(this.pageTitle).toContainText('Buat Lowongan');
  }

  async gotoEdit(jobId: string) {
    await this.page.goto(`/jobs/${jobId}/edit`);
    await expect(this.pageTitle).toContainText('Edit Lowongan');
  }

  async fillBasicInfo(data: Partial<ReturnType<typeof createTestJob>>) {
    if (data.title) {
      await this.titleInput.fill(data.title);
    }
    if (data.location) {
      await this.locationInput.fill(data.location);
    }
    if (data.type) {
      await this.typeSelect.click();
      await this.page.locator(`[data-value="${data.type}"]`).click();
    }
    if (data.experience_level) {
      await this.experienceSelect.click();
      await this.page.locator(`[data-value="${data.experience_level}"]`).click();
    }
  }

  async fillSalary(min: number, max: number, currency = 'IDR', visible = true) {
    await this.salaryMinInput.fill(min.toString());
    await this.salaryMaxInput.fill(max.toString());
    await this.salaryCurrencySelect.click();
    await this.page.locator(`[data-value="${currency}"]`).click();
    if (visible) {
      await this.salaryVisibleCheckbox.check();
    } else {
      await this.salaryVisibleCheckbox.uncheck();
    }
  }

  async fillDescription(content: string) {
    const editor = this.descriptionEditor.locator('.ProseMirror');
    await editor.click();
    await editor.fill(content);
  }

  async fillRequirements(content: string) {
    const editor = this.requirementsEditor.locator('.ProseMirror');
    await editor.click();
    await editor.fill(content);
  }

  async addSkill(skill: string) {
    await this.skillsInput.fill(skill);
    await this.page.keyboard.press('Enter');
  }

  async addBenefit(benefit: string) {
    await this.benefitsInput.fill(benefit);
    await this.page.keyboard.press('Enter');
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

  async fillCompleteJob(jobData = createTestJob()) {
    await this.fillBasicInfo(jobData);
    await this.fillDescription(jobData.description);
    await this.fillRequirements(jobData.requirements);
    await this.fillSalary(
      jobData.salary_min,
      jobData.salary_max,
      jobData.salary_currency,
      jobData.is_salary_visible
    );
    for (const skill of jobData.skills) {
      await this.addSkill(skill);
    }
    for (const benefit of jobData.benefits) {
      await this.addBenefit(benefit);
    }
  }

  async expectValidationErrors() {
    const errors = await this.errorMessages.count();
    expect(errors).toBeGreaterThan(0);
  }

  async expectQuotaWarning() {
    await expect(this.quotaWarning).toBeVisible();
  }

  async expectNoQuotaWarning() {
    await expect(this.quotaWarning).not.toBeVisible();
  }
}
