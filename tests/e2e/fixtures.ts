/**
 * Test Fixtures for Karir Nusantara Company Dashboard
 * 
 * This file defines shared fixtures and test data for E2E tests
 */

import { test as base, expect, Page } from '@playwright/test';

// Test user credentials
export const TEST_USERS = {
  verified: {
    email: 'test-verified@company.com',
    password: 'TestPassword123!',
    companyName: 'Test Verified Company',
    id: 'test-verified-company-id',
  },
  unverified: {
    email: 'test-unverified@company.com',
    password: 'TestPassword123!',
    companyName: 'Test Unverified Company',
    id: 'test-unverified-company-id',
  },
  suspended: {
    email: 'test-suspended@company.com',
    password: 'TestPassword123!',
    companyName: 'Test Suspended Company',
    id: 'test-suspended-company-id',
  },
  noQuota: {
    email: 'test-noquota@company.com',
    password: 'TestPassword123!',
    companyName: 'Test No Quota Company',
    id: 'test-noquota-company-id',
  },
} as const;

// API endpoints
export const API_ENDPOINTS = {
  baseUrl: process.env.API_URL || 'http://localhost:8081',
  auth: {
    login: '/api/v1/company/auth/login',
    register: '/api/v1/company/auth/register',
    logout: '/api/v1/company/auth/logout',
    refresh: '/api/v1/company/auth/refresh',
    forgotPassword: '/api/v1/company/auth/forgot-password',
  },
  jobs: {
    list: '/api/v1/company/jobs',
    create: '/api/v1/company/jobs',
    detail: (id: string) => `/api/v1/company/jobs/${id}`,
    publish: (id: string) => `/api/v1/company/jobs/${id}/publish`,
    close: (id: string) => `/api/v1/company/jobs/${id}/close`,
    reopen: (id: string) => `/api/v1/company/jobs/${id}/reopen`,
  },
  applications: {
    list: '/api/v1/company/applications',
    detail: (id: string) => `/api/v1/company/applications/${id}`,
    updateStatus: (id: string) => `/api/v1/company/applications/${id}/status`,
  },
  quota: {
    get: '/api/v1/company/quota',
    payment: '/api/v1/company/quota/payment',
    paymentHistory: '/api/v1/company/quota/payments',
  },
  profile: {
    get: '/api/v1/company/profile',
    update: '/api/v1/company/profile',
  },
  dashboard: {
    stats: '/api/v1/company/dashboard/stats',
  },
} as const;

// Test data factories
export const createTestJob = (overrides = {}) => ({
  title: 'Test Software Engineer',
  description: '<p>Test job description with HTML</p>',
  requirements: '<p>Test requirements</p>',
  location: 'Jakarta, Indonesia',
  type: 'full-time',
  experience_level: 'mid',
  salary_min: 10000000,
  salary_max: 20000000,
  salary_currency: 'IDR',
  is_salary_visible: true,
  skills: ['JavaScript', 'TypeScript', 'React'],
  benefits: ['Health Insurance', 'Remote Work'],
  ...overrides,
});

export const createTestApplication = (overrides = {}) => ({
  job_id: 'test-job-id',
  applicant_name: 'Test Applicant',
  applicant_email: 'applicant@test.com',
  applicant_phone: '+6281234567890',
  resume_url: 'https://example.com/resume.pdf',
  cover_letter: 'Test cover letter content',
  status: 'submitted',
  ...overrides,
});

// Storage state path for authenticated sessions
export const STORAGE_STATE = {
  verified: 'tests/.auth/verified-user.json',
  unverified: 'tests/.auth/unverified-user.json',
  noQuota: 'tests/.auth/noquota-user.json',
};

// Custom test fixture with authentication
type CustomFixtures = {
  verifiedPage: Page;
  unverifiedPage: Page;
  authenticatedPage: Page;
};

export const test = base.extend<CustomFixtures>({
  // Page with verified company authentication
  verifiedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE.verified,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Page with unverified company authentication
  unverifiedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE.unverified,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },

  // Generic authenticated page (defaults to verified)
  authenticatedPage: async ({ browser }, use) => {
    const context = await browser.newContext({
      storageState: STORAGE_STATE.verified,
    });
    const page = await context.newPage();
    await use(page);
    await context.close();
  },
});

// Re-export expect
export { expect };

// Helper functions
export async function loginAs(page: Page, user: typeof TEST_USERS.verified) {
  await page.goto('/login');
  await page.fill('input[name="email"]', user.email);
  await page.fill('input[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await page.waitForURL('/dashboard');
}

export async function logout(page: Page) {
  await page.click('[data-testid="user-menu"]');
  await page.click('[data-testid="logout-button"]');
  await page.waitForURL('/login');
}

export async function waitForToast(page: Page, message: string) {
  await expect(page.locator('[data-testid="toast"]')).toContainText(message);
}

export async function waitForApiResponse(page: Page, endpoint: string) {
  return page.waitForResponse((response) =>
    response.url().includes(endpoint) && response.status() === 200
  );
}

export async function mockApiResponse(
  page: Page,
  endpoint: string,
  response: object,
  status = 200
) {
  await page.route(`**${endpoint}`, (route) =>
    route.fulfill({
      status,
      contentType: 'application/json',
      body: JSON.stringify(response),
    })
  );
}

// Quota helper
export async function getQuotaInfo(page: Page) {
  const response = await page.request.get(
    `${API_ENDPOINTS.baseUrl}${API_ENDPOINTS.quota.get}`
  );
  return response.json();
}

// Application status values
export const APPLICATION_STATUSES = [
  'submitted',
  'viewed',
  'shortlisted',
  'interview_scheduled',
  'interview_completed',
  'assessment',
  'offer_sent',
  'offer_accepted',
  'hired',
  'rejected',
  'withdrawn',
] as const;

// Valid status transitions
export const VALID_STATUS_TRANSITIONS: Record<string, string[]> = {
  submitted: ['viewed', 'rejected', 'withdrawn'],
  viewed: ['shortlisted', 'rejected', 'withdrawn'],
  shortlisted: ['interview_scheduled', 'rejected', 'withdrawn'],
  interview_scheduled: ['interview_completed', 'rejected', 'withdrawn'],
  interview_completed: ['assessment', 'offer_sent', 'rejected', 'withdrawn'],
  assessment: ['offer_sent', 'rejected', 'withdrawn'],
  offer_sent: ['offer_accepted', 'rejected', 'withdrawn'],
  offer_accepted: ['hired', 'rejected', 'withdrawn'],
  hired: [],
  rejected: [],
  withdrawn: [],
};

// Job status values
export const JOB_STATUSES = [
  'draft',
  'active',
  'paused',
  'closed',
  'filled',
] as const;

// Valid job status transitions
export const VALID_JOB_TRANSITIONS: Record<string, string[]> = {
  draft: ['active'],
  active: ['paused', 'closed', 'filled'],
  paused: ['active', 'closed'],
  closed: ['active'],
  filled: [],
};
