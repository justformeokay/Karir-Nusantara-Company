/**
 * Authentication E2E Tests
 * 
 * Tests for login flow and basic authentication
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS } from './fixtures';
import { LoginPage, DashboardPage } from './pages';

// Mock API responses
async function mockApiResponses(page: any) {
  // Mock dashboard stats
  await page.route('**/api/v1/company/dashboard/stats', async (route: any) => {
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
        },
      }),
    });
  });

  // Mock quota
  await page.route('**/api/v1/company/quota', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {
          free_quota: 3,
          used_free_quota: 1,
          paid_quota: 0,
          used_paid_quota: 0,
        },
      }),
    });
  });

  // Mock jobs list
  await page.route('**/api/v1/company/jobs*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      }),
    });
  });

  // Mock candidates list
  await page.route('**/api/v1/company/applicants*', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: [],
        meta: { total: 0, page: 1, limit: 10 },
      }),
    });
  });

  // Mock all other API calls to prevent hanging
  await page.route('**/api/v1/**', async (route: any) => {
    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify({
        success: true,
        data: {},
      }),
    });
  });
}

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('AUTH-001: should display login page correctly', async ({ page }) => {
    const loginPage = new LoginPage(page);
    await loginPage.goto();

    // Login form should be visible
    await expect(loginPage.emailInput).toBeVisible();
    await expect(loginPage.passwordInput).toBeVisible();
    await expect(loginPage.submitButton).toBeVisible();
  });

  test('AUTH-002: should login with valid credentials and redirect to dashboard', async ({ page }) => {
    // Setup API mocks before navigation
    await mockApiResponses(page);

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.verified.email, TEST_USERS.verified.password);

    // Should redirect to dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
    
    // Dashboard should be visible
    await expect(dashboardPage.pageContainer).toBeVisible({ timeout: 10000 });
  });

  test('AUTH-003: should show validation error for empty fields', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.submitButton.click();

    // Should show validation error
    await expect(page.locator('.text-red-500').first()).toBeVisible({ timeout: 5000 });
  });

  test('AUTH-004: should store auth state after successful login', async ({ page }) => {
    // Setup API mocks
    await mockApiResponses(page);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.verified.email, TEST_USERS.verified.password);

    // Wait for dashboard to load
    await page.waitForURL('/dashboard', { timeout: 15000 });

    // Check localStorage for zustand auth state
    const authState = await page.evaluate(() => {
      return localStorage.getItem('karir-nusantara-company-auth');
    });
    expect(authState).toBeTruthy();
    
    // Parse and verify token
    const parsed = JSON.parse(authState as string);
    expect(parsed.state.token).toBeTruthy();
    expect(parsed.state.isAuthenticated).toBe(true);
  });

  test('AUTH-005: should have navigation links', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();

    // Check forgot password link
    await expect(loginPage.forgotPasswordLink).toBeVisible();
    
    // Check register link
    await expect(loginPage.registerLink).toBeVisible();
  });
});

test.describe('Dashboard Access', () => {
  test('DASH-001: should redirect to login when not authenticated', async ({ page }) => {
    // Navigate to login page first to initialize localStorage
    await page.goto('/login');
    
    // Clear auth state
    await page.evaluate(() => {
      localStorage.removeItem('karir-nusantara-company-auth');
    });
    
    // Try to access dashboard
    await page.goto('/dashboard');

    // Should be redirected to login
    await page.waitForURL(/login/, { timeout: 10000 });
  });

  test('DASH-002: should access dashboard when authenticated', async ({ page }) => {
    // Setup API mocks
    await mockApiResponses(page);

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login(TEST_USERS.verified.email, TEST_USERS.verified.password);

    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });

    // Verify dashboard elements
    await expect(dashboardPage.pageContainer).toBeVisible({ timeout: 10000 });
  });

  test('DASH-003: should display dashboard stats', async ({ page }) => {
    // Setup API mocks
    await mockApiResponses(page);

    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    // Login first
    await loginPage.goto();
    await loginPage.login(TEST_USERS.verified.email, TEST_USERS.verified.password);

    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });

    // Check that stats cards are visible
    await dashboardPage.expectStatsLoaded();
  });
});

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Setup API mocks
    await mockApiResponses(page);

    // Login before each test
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.verified.email, TEST_USERS.verified.password);

    // Wait for dashboard
    await page.waitForURL('/dashboard', { timeout: 15000 });
  });

  test('NAV-001: should navigate to jobs page', async ({ page }) => {
    await page.goto('/jobs');
    await expect(page.locator('[data-testid="jobs-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('NAV-002: should navigate to candidates page', async ({ page }) => {
    await page.goto('/candidates');
    await expect(page.locator('[data-testid="candidates-page"]')).toBeVisible({ timeout: 10000 });
  });

  test('NAV-003: should navigate to quota page', async ({ page }) => {
    await page.goto('/quota');
    await expect(page.locator('[data-testid="quota-page"]')).toBeVisible({ timeout: 10000 });
  });
});
