/**
 * Jobs Page E2E Tests
 * 
 * Tests for jobs list and job creation functionality
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures';
import { LoginPage, JobsPage, JobFormPage } from './pages';

test.describe('Jobs Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.verified.email,
      TEST_USERS.verified.password
    );
  });

  test('JOB-001: should display jobs page correctly', async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    // Page should be visible
    await expect(jobsPage.pageContainer).toBeVisible({ timeout: 10000 });
  });

  test('JOB-002: should display create job button', async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    // Create job button should be visible (for verified companies)
    await expect(jobsPage.createJobButton).toBeVisible({ timeout: 10000 });
  });

  test('JOB-003: should display search input', async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    // Search input should be visible
    await expect(jobsPage.searchInput).toBeVisible({ timeout: 10000 });
  });

  test('JOB-004: should display status filter', async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    // Status filter should be visible
    await expect(jobsPage.statusFilter).toBeVisible({ timeout: 10000 });
  });

  test('JOB-005: should navigate to job form when clicking create', async ({ page }) => {
    const jobsPage = new JobsPage(page);
    await jobsPage.goto();

    // Click create job button
    await jobsPage.clickCreateJob();

    // Should be on job form page
    await expect(page).toHaveURL(/jobs\/new/);
  });
});

test.describe('Job Form Page', () => {
  test.beforeEach(async ({ page }) => {
    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.verified.email,
      TEST_USERS.verified.password
    );
  });

  test('JOBFORM-001: should display job form correctly', async ({ page }) => {
    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();

    // Form should be visible
    await expect(jobFormPage.pageContainer).toBeVisible({ timeout: 10000 });
  });

  test('JOBFORM-002: should display title input', async ({ page }) => {
    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();

    // Title input should be visible
    await expect(jobFormPage.titleInput).toBeVisible({ timeout: 10000 });
  });

  test('JOBFORM-003: should display save draft button', async ({ page }) => {
    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();

    // Save draft button should be visible
    await expect(jobFormPage.saveDraftButton).toBeVisible({ timeout: 10000 });
  });

  test('JOBFORM-004: should display publish button', async ({ page }) => {
    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();

    // Publish button should be visible
    await expect(jobFormPage.publishButton).toBeVisible({ timeout: 10000 });
  });

  test('JOBFORM-005: should be able to fill title', async ({ page }) => {
    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();

    // Fill title
    await jobFormPage.fillTitle('Test Job Position');

    // Verify value
    await expect(jobFormPage.titleInput).toHaveValue('Test Job Position');
  });
});
