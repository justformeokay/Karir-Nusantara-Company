/**
 * Page Object Model: Quota Page
 */

import { Page, Locator, expect } from '@playwright/test';

export class QuotaPage {
  readonly page: Page;
  readonly pageTitle: Locator;
  readonly freeQuotaCard: Locator;
  readonly paidQuotaCard: Locator;
  readonly pricePerJobCard: Locator;
  readonly paymentForm: Locator;
  readonly paymentProofInput: Locator;
  readonly quantityInput: Locator;
  readonly totalPriceDisplay: Locator;
  readonly submitPaymentButton: Locator;
  readonly paymentHistoryTable: Locator;
  readonly bankAccountInfo: Locator;
  readonly copyAccountButton: Locator;

  constructor(page: Page) {
    this.page = page;
    this.pageTitle = page.locator('h1');
    this.freeQuotaCard = page.locator('[data-testid="free-quota-card"]');
    this.paidQuotaCard = page.locator('[data-testid="paid-quota-card"]');
    this.pricePerJobCard = page.locator('[data-testid="price-per-job"]');
    this.paymentForm = page.locator('[data-testid="payment-form"]');
    this.paymentProofInput = page.locator('input[type="file"]');
    this.quantityInput = page.locator('input[name="quantity"]');
    this.totalPriceDisplay = page.locator('[data-testid="total-price"]');
    this.submitPaymentButton = page.locator('[data-testid="submit-payment"]');
    this.paymentHistoryTable = page.locator('[data-testid="payment-history"]');
    this.bankAccountInfo = page.locator('[data-testid="bank-info"]');
    this.copyAccountButton = page.locator('[data-testid="copy-account"]');
  }

  async goto() {
    await this.page.goto('/quota');
    await expect(this.pageTitle).toContainText('Kuota');
  }

  async getFreeQuota(): Promise<{ used: number; remaining: number; total: number }> {
    const text = await this.freeQuotaCard.textContent();
    // Parse format like "2/5 Used" or similar
    const match = text?.match(/(\d+)\/(\d+)/);
    if (match) {
      const used = parseInt(match[1], 10);
      const total = parseInt(match[2], 10);
      return { used, remaining: total - used, total };
    }
    return { used: 0, remaining: 0, total: 0 };
  }

  async getPaidQuota(): Promise<number> {
    const text = await this.paidQuotaCard.locator('[data-testid="quota-value"]').textContent();
    return parseInt(text || '0', 10);
  }

  async getPricePerJob(): Promise<number> {
    const text = await this.pricePerJobCard.locator('[data-testid="price-value"]').textContent();
    // Extract number from formatted price like "Rp 150.000"
    const match = text?.replace(/[^\d]/g, '');
    return parseInt(match || '0', 10);
  }

  async setQuantity(quantity: number) {
    await this.quantityInput.fill(quantity.toString());
  }

  async getTotalPrice(): Promise<string> {
    return await this.totalPriceDisplay.textContent() || '';
  }

  async uploadPaymentProof(filePath: string) {
    await this.paymentProofInput.setInputFiles(filePath);
  }

  async submitPayment() {
    await this.submitPaymentButton.click();
  }

  async copyAccountNumber() {
    await this.copyAccountButton.click();
  }

  async getPaymentHistoryCount(): Promise<number> {
    const rows = this.paymentHistoryTable.locator('tbody tr');
    return await rows.count();
  }

  async expectPaymentStatus(index: number, status: 'pending' | 'confirmed' | 'rejected') {
    const row = this.paymentHistoryTable.locator('tbody tr').nth(index);
    const statusCell = row.locator('[data-testid="payment-status"]');
    await expect(statusCell).toContainText(status);
  }

  async expectQuotaLoaded() {
    await expect(this.freeQuotaCard).toBeVisible();
    await expect(this.paidQuotaCard).toBeVisible();
  }

  async expectPaymentFormVisible() {
    await expect(this.paymentForm).toBeVisible();
  }

  async expectBankInfoVisible() {
    await expect(this.bankAccountInfo).toBeVisible();
  }
}
