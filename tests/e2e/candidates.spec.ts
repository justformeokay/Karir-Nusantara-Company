/**
 * Candidates Page E2E Tests
 * 
 * Tests for candidates list and filtering functionality
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures';
import { LoginPage, CandidatesPage } from './pages';

test.describe('Candidates Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.verified.email,
      TEST_USERS.verified.password
    );
  });

  test('CAND-001: should display candidates page correctly', async ({ page }) => {
    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Page should be visible
    await expect(candidatesPage.pageContainer).toBeVisible({ timeout: 10000 });
  });

  test('CAND-002: should display search input', async ({ page }) => {
    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Search input should be visible
    await expect(candidatesPage.searchInput).toBeVisible({ timeout: 10000 });
  });

  test('CAND-003: should display status filter', async ({ page }) => {
    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Status filter should be visible
    await expect(candidatesPage.statusFilter).toBeVisible({ timeout: 10000 });
  });

  test('CAND-004: should display job filter', async ({ page }) => {
    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Job filter should be visible
    await expect(candidatesPage.jobFilter).toBeVisible({ timeout: 10000 });
  });

  test('CAND-005: should display candidates list or empty state', async ({ page }) => {
    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Wait for content to load
    await page.waitForTimeout(2000);

    // Either candidates list or empty state should be visible
    await candidatesPage.expectCandidatesLoaded();
  });

  test('CAND-006: should be able to search candidates', async ({ page }) => {
    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Type in search input
    await candidatesPage.searchCandidates('test');

    // Search should work without error
    await page.waitForTimeout(1000);
  });
});
