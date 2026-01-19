/**
 * Authentication Setup - Creates authenticated storage states
 * 
 * This setup runs before all tests to create reusable authenticated sessions
 */

import { test as setup, expect } from '@playwright/test';
import { TEST_USERS, STORAGE_STATE, API_ENDPOINTS } from './fixtures';

// Setup authenticated session for verified company
setup('authenticate as verified company', async ({ page }) => {
  // Navigate to login page
  await page.goto('/login');

  // Wait for login form to be visible
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });

  // Fill login form using data-testid selectors
  await page.locator('[data-testid="email-input"]').fill(TEST_USERS.verified.email);
  await page.locator('[data-testid="password-input"]').fill(TEST_USERS.verified.password);

  // Submit form and wait for navigation
  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE.verified });
});

// Setup authenticated session for unverified company
setup('authenticate as unverified company', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });

  await page.locator('[data-testid="email-input"]').fill(TEST_USERS.unverified.email);
  await page.locator('[data-testid="password-input"]').fill(TEST_USERS.unverified.password);

  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE.unverified });
});

// Setup authenticated session for company with no quota
setup('authenticate as company with no quota', async ({ page }) => {
  await page.goto('/login');
  await expect(page.locator('[data-testid="login-form"]')).toBeVisible({ timeout: 10000 });

  await page.locator('[data-testid="email-input"]').fill(TEST_USERS.noQuota.email);
  await page.locator('[data-testid="password-input"]').fill(TEST_USERS.noQuota.password);

  await page.locator('[data-testid="login-button"]').click();
  await page.waitForURL('/dashboard', { timeout: 15000 });

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE.noQuota });
});

// Create .auth directory if it doesn't exist
setup.beforeAll(async () => {
  const fs = await import('fs/promises');
  try {
    await fs.mkdir('tests/.auth', { recursive: true });
  } catch {
    // Directory might already exist
  }
});
