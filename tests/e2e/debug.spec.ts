/**
 * Debug test to understand what's happening
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures';
import { LoginPage, DashboardPage } from './pages';

test('Debug: login and check dashboard', async ({ page }) => {
  // Set up request interception logging
  page.on('request', request => {
    if (request.url().includes('8081')) {
      console.log('>> Request:', request.method(), request.url());
    }
  });

  page.on('response', response => {
    if (response.url().includes('8081')) {
      console.log('<< Response:', response.status(), response.url());
    }
  });

  // Mock ONLY backend API requests (localhost:8081)
  await page.route('**/localhost:8081/**', async (route) => {
    console.log('INTERCEPTED:', route.request().url());
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          active_jobs: 5,
          total_applicants: 120,
          under_review: 25,
          accepted: 10,
          recent_applicants: [],
          active_jobs_list: [],
          free_quota: 3,
          used_free_quota: 1,
          paid_quota: 0,
          used_paid_quota: 0,
        },
      }),
    });
  });

  // Go to login page
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  
  // Login
  await loginPage.login(TEST_USERS.verified.email, TEST_USERS.verified.password);
  
  // Wait for navigation
  console.log('Waiting for dashboard URL...');
  await page.waitForURL('/dashboard', { timeout: 15000 });
  console.log('Current URL:', page.url());
  
  // Wait a bit for API calls
  await page.waitForTimeout(3000);
  
  // Check what's on the page
  const content = await page.content();
  console.log('Page contains dashboard-page:', content.includes('data-testid="dashboard-page"'));
  console.log('Page contains DashboardSkeleton:', content.includes('Skeleton'));
  
  // Log body text
  const bodyText = await page.locator('body').textContent();
  console.log('Body text (first 500 chars):', bodyText?.substring(0, 500));
  
  // Check dashboard
  const dashboardPage = new DashboardPage(page);
  await expect(dashboardPage.pageContainer).toBeVisible({ timeout: 10000 });
});
