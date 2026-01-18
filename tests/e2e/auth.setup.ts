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

  // Fill login form
  await page.fill('input[name="email"]', TEST_USERS.verified.email);
  await page.fill('input[name="password"]', TEST_USERS.verified.password);

  // Submit form and wait for navigation
  await Promise.all([
    page.waitForURL('/dashboard'),
    page.click('button[type="submit"]'),
  ]);

  // Verify we're logged in
  await expect(page.locator('h1')).toContainText('Dashboard');

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE.verified });
});

// Setup authenticated session for unverified company
setup('authenticate as unverified company', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', TEST_USERS.unverified.email);
  await page.fill('input[name="password"]', TEST_USERS.unverified.password);

  await Promise.all([
    page.waitForURL('/dashboard'),
    page.click('button[type="submit"]'),
  ]);

  // Save storage state
  await page.context().storageState({ path: STORAGE_STATE.unverified });
});

// Setup authenticated session for company with no quota
setup('authenticate as company with no quota', async ({ page }) => {
  await page.goto('/login');

  await page.fill('input[name="email"]', TEST_USERS.noQuota.email);
  await page.fill('input[name="password"]', TEST_USERS.noQuota.password);

  await Promise.all([
    page.waitForURL('/dashboard'),
    page.click('button[type="submit"]'),
  ]);

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
