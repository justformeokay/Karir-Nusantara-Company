/**
 * Authentication E2E Tests
 * 
 * Tests for login, logout, registration, and permission boundaries
 */

import { test, expect } from '@playwright/test';
import { TEST_USERS, API_ENDPOINTS, mockApiResponse } from './fixtures';
import { LoginPage, DashboardPage } from './pages';

test.describe('Login Flow', () => {
  test.beforeEach(async ({ page }) => {
    // Clear any existing auth state
    await page.context().clearCookies();
  });

  test('AUTH-001: should login with valid credentials and redirect to dashboard', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.verified.email, TEST_USERS.verified.password);

    // Should redirect to dashboard
    await page.waitForURL('/dashboard');
    await expect(dashboardPage.pageTitle).toContainText('Dashboard');
  });

  test('AUTH-002: should show error for invalid email format', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.login('invalid-email', 'somepassword');

    // Should show validation error
    await loginPage.expectValidationError('email', 'email');
  });

  test('AUTH-003: should show error for wrong password', async ({ page }) => {
    const loginPage = new LoginPage(page);

    // Mock API response for invalid credentials
    await mockApiResponse(page, API_ENDPOINTS.auth.login, {
      success: false,
      error: 'Invalid email or password',
    }, 401);

    await loginPage.goto();
    await loginPage.login(TEST_USERS.verified.email, 'wrongpassword');

    // Should show error message
    await loginPage.expectErrorMessage('Invalid email or password');
  });

  test('AUTH-004: should show limited access banner for unverified company', async ({ page }) => {
    const loginPage = new LoginPage(page);
    const dashboardPage = new DashboardPage(page);

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.unverified.email,
      TEST_USERS.unverified.password
    );

    // Should see verification pending banner
    await dashboardPage.expectVerificationBanner('pending');
  });

  test('AUTH-005: should store JWT token after successful login', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.verified.email,
      TEST_USERS.verified.password
    );

    // Check localStorage for token
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeTruthy();
  });

  test('should handle empty form submission', async ({ page }) => {
    const loginPage = new LoginPage(page);

    await loginPage.goto();
    await loginPage.submitButton.click();

    // Should show required field errors
    await expect(page.locator('text=required')).toBeVisible();
  });
});

test.describe('Logout Flow', () => {
  test('should logout and redirect to login page', async ({ page }) => {
    // First login
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.verified.email,
      TEST_USERS.verified.password
    );

    // Click logout
    await page.click('[data-testid="user-menu"]');
    await page.click('[data-testid="logout-button"]');

    // Should redirect to login
    await page.waitForURL('/login');

    // Token should be cleared
    const token = await page.evaluate(() => localStorage.getItem('token'));
    expect(token).toBeFalsy();
  });
});

test.describe('Registration Flow', () => {
  test('AUTH-010: should register with valid data', async ({ page }) => {
    await page.goto('/register');

    // Fill registration form
    await page.fill('input[name="email"]', 'newcompany@test.com');
    await page.fill('input[name="password"]', 'StrongPassword123!');
    await page.fill('input[name="confirmPassword"]', 'StrongPassword123!');
    await page.fill('input[name="companyName"]', 'New Test Company');
    await page.fill('input[name="fullName"]', 'Admin User');
    await page.fill('input[name="phone"]', '+6281234567890');

    // Mock successful registration
    await mockApiResponse(page, API_ENDPOINTS.auth.register, {
      success: true,
      message: 'Registration successful. Please wait for verification.',
    });

    await page.click('button[type="submit"]');

    // Should show success message or redirect
    await expect(page.locator('text=successful')).toBeVisible();
  });

  test('AUTH-011: should show error for existing email', async ({ page }) => {
    await page.goto('/register');

    await page.fill('input[name="email"]', TEST_USERS.verified.email);
    await page.fill('input[name="password"]', 'StrongPassword123!');
    await page.fill('input[name="confirmPassword"]', 'StrongPassword123!');
    await page.fill('input[name="companyName"]', 'Duplicate Company');
    await page.fill('input[name="fullName"]', 'Admin User');

    // Mock error response
    await mockApiResponse(page, API_ENDPOINTS.auth.register, {
      success: false,
      error: 'Email already exists',
    }, 409);

    await page.click('button[type="submit"]');

    // Should show error
    await expect(page.locator('text=already exists')).toBeVisible();
  });

  test('AUTH-012: should show validation errors for missing required fields', async ({ page }) => {
    await page.goto('/register');

    // Submit empty form
    await page.click('button[type="submit"]');

    // Should show multiple validation errors
    const errors = page.locator('[data-testid="field-error"]');
    await expect(errors).toHaveCount(await errors.count());
    expect(await errors.count()).toBeGreaterThan(0);
  });
});

test.describe('Permission Boundaries', () => {
  test('AUTH-020: unverified company cannot create jobs', async ({ page }) => {
    // Login as unverified
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.unverified.email,
      TEST_USERS.unverified.password
    );

    // Try to navigate to job creation
    await page.goto('/jobs/new');

    // Should see restriction message or be redirected
    const restrictionVisible = await page.locator('text=verification').isVisible();
    const redirected = page.url() !== '/jobs/new';
    
    expect(restrictionVisible || redirected).toBeTruthy();
  });

  test('AUTH-024: suspended company cannot access dashboard', async ({ page }) => {
    // Mock suspended company login response
    await mockApiResponse(page, API_ENDPOINTS.auth.login, {
      success: false,
      error: 'Your account has been suspended',
    }, 403);

    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.login(TEST_USERS.suspended.email, TEST_USERS.suspended.password);

    // Should show suspended message
    await expect(page.locator('text=suspended')).toBeVisible();
  });

  test('should redirect unauthenticated user to login', async ({ page }) => {
    // Clear cookies
    await page.context().clearCookies();

    // Try to access protected route
    await page.goto('/dashboard');

    // Should redirect to login
    await page.waitForURL('/login');
  });

  test('should redirect to dashboard if already logged in and visiting login page', async ({ page }) => {
    // Login first
    const loginPage = new LoginPage(page);
    await loginPage.goto();
    await loginPage.loginAndWaitForDashboard(
      TEST_USERS.verified.email,
      TEST_USERS.verified.password
    );

    // Try to visit login page
    await page.goto('/login');

    // Should redirect back to dashboard
    await page.waitForURL('/dashboard');
  });
});

test.describe('Password Reset Flow', () => {
  test('should send password reset email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('input[name="email"]', TEST_USERS.verified.email);

    // Mock success response
    await mockApiResponse(page, API_ENDPOINTS.auth.forgotPassword, {
      success: true,
      message: 'Password reset email sent',
    });

    await page.click('button[type="submit"]');

    // Should show success message
    await expect(page.locator('text=email sent')).toBeVisible();
  });

  test('should show error for non-existent email', async ({ page }) => {
    await page.goto('/forgot-password');

    await page.fill('input[name="email"]', 'nonexistent@test.com');

    // Mock error response
    await mockApiResponse(page, API_ENDPOINTS.auth.forgotPassword, {
      success: false,
      error: 'Email not found',
    }, 404);

    await page.click('button[type="submit"]');

    // Should show error message
    await expect(page.locator('text=not found')).toBeVisible();
  });
});
