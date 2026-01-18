/**
 * Payment Flow E2E Tests
 * 
 * Tests for payment proof upload, payment status, and quota increment after payment
 */

import { test, expect } from '@playwright/test';
import { 
  API_ENDPOINTS, 
  mockApiResponse, 
  STORAGE_STATE 
} from './fixtures';
import { QuotaPage } from './pages';
import path from 'path';

test.describe('Payment Proof Upload', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('PAY-001: Upload payment proof with valid image succeeds', async ({ page }) => {
    // Mock quota response
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

    // Mock payment proof upload
    await mockApiResponse(page, API_ENDPOINTS.quota.payment, {
      success: true,
      message: 'Payment proof uploaded successfully',
      data: {
        id: 'payment-1',
        status: 'pending',
        quantity: 5,
        total_amount: 750000,
      },
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Set quantity
    await quotaPage.setQuantity(5);

    // Verify total price calculation
    const totalPrice = await quotaPage.getTotalPrice();
    expect(totalPrice).toContain('750.000'); // 5 * 150,000

    // Create a test image file upload using Playwright's file chooser
    await quotaPage.paymentProofInput.setInputFiles({
      name: 'payment-proof.jpg',
      mimeType: 'image/jpeg',
      buffer: Buffer.from('fake-image-content'),
    });

    await quotaPage.submitPayment();

    // Should show success message
    await expect(page.locator('text=successfully')).toBeVisible();
  });

  test('PAY-002: Upload file exceeding 5MB shows error', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Create a large file (6MB)
    const largeBuffer = Buffer.alloc(6 * 1024 * 1024, 'x');

    await quotaPage.paymentProofInput.setInputFiles({
      name: 'large-file.jpg',
      mimeType: 'image/jpeg',
      buffer: largeBuffer,
    });

    // Should show error about file size
    await expect(page.locator('text=5MB')).toBeVisible();
  });

  test('PAY-003: Upload non-image file shows error', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    await quotaPage.paymentProofInput.setInputFiles({
      name: 'document.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake-pdf-content'),
    });

    // Should show error about file type
    await expect(page.locator('text=image')).toBeVisible();
  });
});

test.describe('Payment Status Display', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('PAY-010: Pending payment shows waiting status', async ({ page }) => {
    // Mock quota with payment history
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

    // Mock payment history
    await mockApiResponse(page, API_ENDPOINTS.quota.paymentHistory, {
      success: true,
      data: [
        {
          id: 'payment-1',
          quantity: 5,
          total_amount: 750000,
          status: 'pending',
          created_at: new Date().toISOString(),
        },
      ],
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Check payment history status
    await quotaPage.expectPaymentStatus(0, 'pending');
  });

  test('PAY-011: Confirmed payment shows confirmed status', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.quota.paymentHistory, {
      success: true,
      data: [
        {
          id: 'payment-1',
          quantity: 5,
          total_amount: 750000,
          status: 'confirmed',
          confirmed_at: new Date().toISOString(),
          created_at: new Date().toISOString(),
        },
      ],
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    await quotaPage.expectPaymentStatus(0, 'confirmed');
  });

  test('PAY-012: Rejected payment shows rejected status with note', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.quota.paymentHistory, {
      success: true,
      data: [
        {
          id: 'payment-1',
          quantity: 5,
          total_amount: 750000,
          status: 'rejected',
          rejection_note: 'Invalid payment proof',
          created_at: new Date().toISOString(),
        },
      ],
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    await quotaPage.expectPaymentStatus(0, 'rejected');
    
    // Click to see rejection note
    await page.locator('[data-testid="payment-details-0"]').click();
    await expect(page.locator('text=Invalid payment proof')).toBeVisible();
  });
});

test.describe('Payment Info Display', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('PAY-020: Payment page shows bank account details', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    await quotaPage.expectBankInfoVisible();

    // Check bank info contains expected details
    const bankInfo = await quotaPage.bankAccountInfo.textContent();
    expect(bankInfo).toBeTruthy();
    // Should show account number or bank name
    expect(bankInfo?.length).toBeGreaterThan(10);
  });

  test('PAY-021: Copy account number works correctly', async ({ page }) => {
    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Mock clipboard
    await page.evaluate(() => {
      Object.assign(navigator, {
        clipboard: {
          writeText: jest.fn(),
        },
      });
    });

    await quotaPage.copyAccountNumber();

    // Should show copied confirmation
    await expect(page.locator('text=Copied')).toBeVisible();
  });

  test('PAY-022: Price per job is displayed correctly', async ({ page }) => {
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

    const price = await quotaPage.getPricePerJob();
    expect(price).toBe(150000);
  });
});

test.describe('Payment History', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('PAY-005: Payment history shows uploaded proofs', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.quota.paymentHistory, {
      success: true,
      data: [
        {
          id: 'payment-1',
          quantity: 5,
          total_amount: 750000,
          status: 'pending',
          proof_url: 'https://example.com/proof1.jpg',
          created_at: '2024-01-15T10:00:00Z',
        },
        {
          id: 'payment-2',
          quantity: 3,
          total_amount: 450000,
          status: 'confirmed',
          proof_url: 'https://example.com/proof2.jpg',
          created_at: '2024-01-10T10:00:00Z',
        },
      ],
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    const historyCount = await quotaPage.getPaymentHistoryCount();
    expect(historyCount).toBe(2);
  });

  test('Payment history shows empty state when no payments', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.quota.paymentHistory, {
      success: true,
      data: [],
    });

    const quotaPage = new QuotaPage(page);
    await quotaPage.goto();

    // Should show empty state or message
    await expect(page.locator('text=No payment')).toBeVisible();
  });
});

test.describe('Quota Increment After Payment', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('PAY-013: Confirmed payment triggers quota increment', async ({ page }) => {
    // First state: no paid quota
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

    let paidQuota = await quotaPage.getPaidQuota();
    expect(paidQuota).toBe(0);

    // Simulate payment confirmation (in real scenario, this happens in admin)
    // Here we just mock the updated quota response
    await mockApiResponse(page, API_ENDPOINTS.quota.get, {
      success: true,
      data: {
        free_quota: 5,
        used_free_quota: 5,
        remaining_free_quota: 0,
        paid_quota: 5, // Incremented after payment confirmation
        price_per_job: 150000,
      },
    });

    // Refresh page to get updated quota
    await page.reload();

    paidQuota = await quotaPage.getPaidQuota();
    expect(paidQuota).toBe(5);
  });
});
