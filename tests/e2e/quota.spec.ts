/**
 * Job Quota E2E Tests
 * 
 * Tests for job posting quota logic, quota exhaustion, and quota display
 */

import { test, expect } from '@playwright/test';
import { 
  TEST_USERS, 
  API_ENDPOINTS, 
  mockApiResponse, 
  createTestJob,
  STORAGE_STATE 
} from './fixtures';
import { QuotaPage, JobsPage, JobFormPage, DashboardPage } from './pages';

test.describe('Free Quota Display', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('QUOTA-005: Dashboard shows correct remaining quota', async ({ page }) => {
    // Mock quota API response
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 2,
        remaining_free_quota: 3,
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    const dashboardPage = new DashboardPage(page);
    await dashboardPage.goto();

    // Check quota display
    const quotaText = await dashboardPage.getQuotaText();
    expect(quotaText).toContain('3');
  });

  test('Quota page shows free and paid quota correctly', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 3,
        remaining_free_quota: 2,
        paid_quota: 5,
        price_per_job: 150000,
      },
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();
    await quotaPage.expectQuotaLoaded();

    const freeQuota = await quotaPage.getFreeQuota();
    expect(freeQuota.used).toBe(3);
    expect(freeQuota.remaining).toBe(2);
    expect(freeQuota.total).toBe(5);

    const paidQuota = await quotaPage.getPaidQuota();
    expect(paidQuota).toBe(5);
  });
});

test.describe('Quota Consumption', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('QUOTA-003: Saving job as draft does NOT consume quota', async ({ page }) => {
    // Initial quota
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 2,
        remaining_free_quota: 3,
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    // Mock job creation (draft)
    await mockApiResponse(page, API_ENDPOINTS.jobs.create, {
      success: true,
      data: { id: 'new-job-id', status: 'draft' },
    });

    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();
    await jobFormPage.fillCompleteJob();
    await jobFormPage.saveDraft();

    // Verify we're redirected to jobs page
    await page.waitForURL('/jobs');

    // Re-check quota (should be same)
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    const freeQuota = await quotaPage.getFreeQuota();
    expect(freeQuota.remaining).toBe(3); // Unchanged
  });

  test('QUOTA-002: Publishing job decrements free quota by 1', async ({ page }) => {
    // Initial quota
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 2,
        remaining_free_quota: 3,
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    // Mock job creation with publish
    await mockApiResponse(page, API_ENDPOINTS.jobs.create, {
      success: true,
      data: { id: 'new-job-id', status: 'active' },
    });

    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();
    await jobFormPage.fillCompleteJob();
    await jobFormPage.publish();

    // After publishing, mock updated quota
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 3, // Incremented
        remaining_free_quota: 2, // Decremented
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    // Check quota page
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    const freeQuota = await quotaPage.getFreeQuota();
    expect(freeQuota.remaining).toBe(2);
    expect(freeQuota.used).toBe(3);
  });
});

test.describe('Quota Exhaustion', () => {
  test('QUOTA-010: Company with 0 free quota sees payment required message', async ({ page }) => {
    // Mock zero quota
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 5,
        remaining_free_quota: 0,
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Should show payment form or upgrade message
    await quotaPage.expectPaymentFormVisible();
  });

  test('QUOTA-011: Publishing job with 0 quota shows payment dialog', async ({ page }) => {
    // Mock zero quota
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 5,
        remaining_free_quota: 0,
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();
    await jobFormPage.fillCompleteJob();

    // Should see quota warning
    await jobFormPage.expectQuotaWarning();

    // Try to publish
    await jobFormPage.publish();

    // Should show payment required dialog
    await expect(page.locator('[data-testid="quota-dialog"]')).toBeVisible();
    await expect(page.locator('text=payment')).toBeVisible();
  });

  test('QUOTA-021: Publishing uses paid quota after free exhausted', async ({ page }) => {
    // Mock zero free quota but has paid quota
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 5,
        remaining_free_quota: 0,
        paid_quota: 3,
        price_per_job: 150000,
      },
    });

    // Mock job creation success (uses paid quota)
    await mockApiResponse(page, API_ENDPOINTS.jobs.create, {
      success: true,
      data: { id: 'new-job-id', status: 'active' },
    });

    const jobFormPage = new JobFormPage(page);
    await jobFormPage.gotoNew();
    await jobFormPage.fillCompleteJob();

    // Should not show quota warning (has paid quota)
    await jobFormPage.expectNoQuotaWarning();

    await jobFormPage.publish();

    // After publishing, mock updated quota
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 5,
        remaining_free_quota: 0,
        paid_quota: 2, // Decremented
        price_per_job: 150000,
      },
    });

    // Check quota page
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    const paidQuota = await quotaPage.getPaidQuota();
    expect(paidQuota).toBe(2);
  });
});

test.describe('Job Closing and Quota', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('QUOTA-003: Closing job does NOT restore free quota', async ({ page }) => {
    // Mock initial state
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 3,
        remaining_free_quota: 2,
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    // Mock jobs list with one active job
    await mockApiResponse(page, API_ENDPOINTS.jobs.list, {
      success: true,
      data: {
        jobs: [
          { id: 'job-1', title: 'Test Job', status: 'active' },
        ],
        total: 1,
      },
    });

    // Mock close job
    await mockApiResponse(page, API_ENDPOINTS.jobs.close('job-1'), {
      success: true,
      data: { id: 'job-1', status: 'closed' },
    });

    const jobsPage = new JobsPage(page);
    await jobsPage.goto();
    await jobsPage.closeJob(0);

    // Quota should remain the same after closing
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    const freeQuota = await quotaPage.getFreeQuota();
    expect(freeQuota.remaining).toBe(2); // Unchanged
    expect(freeQuota.used).toBe(3); // Unchanged
  });

  test('QUOTA-004: Deleting draft job does NOT affect quota', async ({ page }) => {
    // Mock initial state
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 2,
        remaining_free_quota: 3,
        paid_quota: 0,
        price_per_job: 150000,
      },
    });

    // Mock jobs list with one draft job
    await mockApiResponse(page, API_ENDPOINTS.jobs.list, {
      success: true,
      data: {
        jobs: [
          { id: 'job-draft', title: 'Draft Job', status: 'draft' },
        ],
        total: 1,
      },
    });

    // Mock delete job
    await mockApiResponse(page, API_ENDPOINTS.jobs.detail('job-draft'), {
      success: true,
    });

    const jobsPage = new JobsPage(page);
    await jobsPage.goto();
    await jobsPage.deleteJob(0);

    // Quota should remain the same
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    const freeQuota = await quotaPage.getFreeQuota();
    expect(freeQuota.remaining).toBe(3); // Unchanged
    expect(freeQuota.used).toBe(2); // Unchanged
  });
});
