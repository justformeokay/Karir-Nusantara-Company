/**
 * Quota Page E2E Tests
 * 
 * Tests for quota display and payment functionality
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures';
import { LoginPage, QuotaPage } from './pages';

test.describe('Quota Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.verified.email,
      TEST_USERS.verified.password
    );
  });

  test('QUOTA-001: should display quota page correctly', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Page should be visible
    await expect(quotaPage.pageContainer).toBeVisible({ timeout: 10000 });
  });

  test('QUOTA-002: should display free quota card', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Free quota card should be visible
    await expect(quotaPage.freeQuotaCard).toBeVisible({ timeout: 10000 });
  });

  test('QUOTA-003: should display payment info card', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Payment info card should be visible
    await expect(quotaPage.paymentInfoCard).toBeVisible({ timeout: 10000 });
  });

  test('QUOTA-004: should display payment history section', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Payment history should be visible
    await expect(quotaPage.paymentHistory).toBeVisible({ timeout: 10000 });
  });

  test('QUOTA-005: should have submit payment button', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Submit payment button should be visible
    await expect(quotaPage.submitPaymentButton).toBeVisible({ timeout: 10000 });
  });

  test('QUOTA-006: should display quota value', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Wait for quota to load
    await expect(quotaPage.freeQuotaCard).toBeVisible({ timeout: 10000 });

    // Quota value should be displayed
    const quotaValue = quotaPage.quotaValue;
    await expect(quotaValue).toBeVisible();
  });
});
