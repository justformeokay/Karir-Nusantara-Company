/**
 * Page Object Model: Quota Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class QuotaPage {
  readonly page: Page;
  readonly pageContainer: Locator;
  readonly pageTitle: Locator;
  readonly freeQuotaCard: Locator;
  readonly paymentInfoCard: Locator;
  readonly submitPaymentButton: Locator;
  readonly paymentHistory: Locator;
  readonly quotaValue: Locator;
  readonly quotaUsage: Locator;
  readonly quotaWarning: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageContainer = page.locator('[data-testid="quota-page"]');
    this.pageTitle = page.locator('[data-testid="page-title"]');
    this.freeQuotaCard = page.locator('[data-testid="free-quota-card"]');
    this.paymentInfoCard = page.locator('[data-testid="payment-info-card"]');
    this.submitPaymentButton = page.locator('[data-testid="submit-payment-button"]');
    this.paymentHistory = page.locator('[data-testid="payment-history"]');
    this.quotaValue = page.locator('[data-testid="quota-value"]');
    this.quotaUsage = page.locator('[data-testid="quota-usage"]');
    this.quotaWarning = page.locator('[data-testid="quota-warning"]');
  }

  async goto() {
    await this.page.goto('/quota');
    // Wait for page to be visible
    await expect(this.pageContainer).toBeVisible({ timeout: 10000 });
  }

  async getFreeQuota(): Promise<{ remaining: number }> {
    const text = await this.quotaValue.textContent();
    const remaining = parseInt(text || '0', 10);
    return { remaining };
  }

  async getQuotaUsage(): Promise<string> {
    return await this.quotaUsage.textContent() || '';
  }

  async expectQuotaWarning() {
    await expect(this.quotaWarning).toBeVisible();
  }

  async expectNoQuotaWarning() {
    await expect(this.quotaWarning).not.toBeVisible();
  }

  async clickSubmitPayment() {
    await this.submitPaymentButton.click();
  }

  async getPaymentHistoryCount(): Promise<number> {
    const rows = this.paymentHistory.locator('[data-testid="payment-history-list"] tr');
    return await rows.count();
  }

  async expectQuotaLoaded() {
    await expect(this.freeQuotaCard).toBeVisible({ timeout: 10000 });
    await expect(this.paymentInfoCard).toBeVisible({ timeout: 10000 });
  }

  async expectPaymentHistoryVisible() {
    await expect(this.paymentHistory).toBeVisible();
  }
}
