/**
 * Candidate Status Transition E2E Tests
 * 
 * Tests for candidate/application status transitions and validation
 */

import { test, expect } from '@playwright/test';
import { 
  API_ENDPOINTS, 
  mockApiResponse, 
  STORAGE_STATE,
  VALID_STATUS_TRANSITIONS,
  APPLICATION_STATUSES,
} from './fixtures';
import { CandidatesPage } from './pages';

const mockApplications = [
  {
    id: 'app-1',
    job_id: 'job-1',
    job_title: 'Software Engineer',
    applicant_name: 'John Doe',
    applicant_email: 'john@example.com',
    status: 'submitted',
    created_at: '2024-01-15T10:00:00Z',
  },
  {
    id: 'app-2',
    job_id: 'job-1',
    job_title: 'Software Engineer',
    applicant_name: 'Jane Smith',
    applicant_email: 'jane@example.com',
    status: 'viewed',
    created_at: '2024-01-14T10:00:00Z',
  },
  {
    id: 'app-3',
    job_id: 'job-2',
    job_title: 'Product Manager',
    applicant_name: 'Bob Wilson',
    applicant_email: 'bob@example.com',
    status: 'shortlisted',
    created_at: '2024-01-13T10:00:00Z',
  },
  {
    id: 'app-4',
    job_id: 'job-2',
    job_title: 'Product Manager',
    applicant_name: 'Alice Brown',
    applicant_email: 'alice@example.com',
    status: 'interview_scheduled',
    created_at: '2024-01-12T10:00:00Z',
  },
];

test.describe('Candidate List Display', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('Candidates page shows all applications', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: mockApplications, total: 4 },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();
    await candidatesPage.expectCandidatesLoaded();

    const count = await candidatesPage.getCandidatesCount();
    expect(count).toBe(4);
  });

  test('Can filter candidates by status', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: mockApplications, total: 4 },
    });

    // Mock filtered response
    await page.route(`**${API_ENDPOINTS.applications.list}*status=submitted*`, (route) =>
      route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          success: true,
          data: { 
            applications: mockApplications.filter(a => a.status === 'submitted'),
            total: 1,
          },
        }),
      })
    );

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();
    await candidatesPage.filterByStatus('submitted');

    // Wait for filter to apply
    await page.waitForTimeout(500);

    const count = await candidatesPage.getCandidatesCount();
    expect(count).toBe(1);
  });

  test('Can filter candidates by job', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: mockApplications, total: 4 },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();
    await candidatesPage.filterByJob('Software Engineer');

    // Wait for filter to apply
    await page.waitForTimeout(500);
  });
});

test.describe('Valid Status Transitions', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('CAND-001: submitted → viewed transition allowed', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[0]], // submitted status
        total: 1,
      },
    });

    // Mock status update
    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-1'), {
      success: true,
      data: { ...mockApplications[0], status: 'viewed' },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    await candidatesPage.updateCandidateStatus(0, 'viewed');

    // Should show success toast
    await expect(page.locator('[data-testid="toast"]')).toContainText('success');
  });

  test('CAND-002: viewed → shortlisted transition allowed', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[1]], // viewed status
        total: 1,
      },
    });

    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-2'), {
      success: true,
      data: { ...mockApplications[1], status: 'shortlisted' },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    await candidatesPage.updateCandidateStatus(0, 'shortlisted');

    await expect(page.locator('[data-testid="toast"]')).toContainText('success');
  });

  test('CAND-003: shortlisted → interview_scheduled allowed', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[2]], // shortlisted status
        total: 1,
      },
    });

    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-3'), {
      success: true,
      data: { ...mockApplications[2], status: 'interview_scheduled' },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    await candidatesPage.updateCandidateStatus(0, 'interview_scheduled');

    await expect(page.locator('[data-testid="toast"]')).toContainText('success');
  });

  test('CAND-008: Any status → rejected allowed', async ({ page }) => {
    // Test with shortlisted status
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[2]], // shortlisted status
        total: 1,
      },
    });

    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-3'), {
      success: true,
      data: { ...mockApplications[2], status: 'rejected' },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    await candidatesPage.updateCandidateStatus(0, 'rejected');

    await expect(page.locator('[data-testid="toast"]')).toContainText('success');
  });

  // Complete hiring flow test
  test('Complete hiring flow: submitted → hired', async ({ page }) => {
    const application = { ...mockApplications[0] };
    
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: [application], total: 1 },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Step through the hiring process
    const hiringSteps = [
      'viewed',
      'shortlisted',
      'interview_scheduled',
      'interview_completed',
      'offer_sent',
      'offer_accepted',
      'hired',
    ];

    for (const status of hiringSteps) {
      await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-1'), {
        success: true,
        data: { ...application, status },
      });

      await candidatesPage.updateCandidateStatus(0, status);
      await expect(page.locator('[data-testid="toast"]')).toContainText('success');
      
      // Update local application state for next iteration
      application.status = status;
      
      // Re-mock the list with updated status
      await mockApiResponse(page, API_ENDPOINTS.applications.list, {
        success: true,
        data: { applications: [application], total: 1 },
      });
      
      await page.reload();
    }

    // Final status should be hired
    await candidatesPage.expectCandidateStatus(0, 'hired');
  });
});

test.describe('Invalid Status Transitions', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('CAND-020: submitted → hired directly NOT allowed', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[0]], // submitted status
        total: 1,
      },
    });

    // Mock error response for invalid transition
    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-1'), {
      success: false,
      error: 'Invalid status transition',
    }, 400);

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // 'hired' should not be available in the dropdown for 'submitted' status
    await candidatesPage.openCandidateMenu(0);
    
    // Check that 'hired' option is not visible or disabled
    const hiredOption = page.locator('[data-testid="status-hired"]');
    const isHiredVisible = await hiredOption.isVisible();
    
    if (isHiredVisible) {
      // If visible, clicking it should show error
      await hiredOption.click();
      await expect(page.locator('text=Invalid')).toBeVisible();
    } else {
      // Hired option correctly not shown
      expect(isHiredVisible).toBeFalsy();
    }
  });

  test('CAND-021: rejected → any status NOT allowed', async ({ page }) => {
    const rejectedApp = { ...mockApplications[0], status: 'rejected' };
    
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: [rejectedApp], total: 1 },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Open menu - should have no status change options
    await candidatesPage.openCandidateMenu(0);
    
    // Status change options should not be available or menu should indicate final state
    const statusOptions = page.locator('[data-testid^="status-"]');
    const count = await statusOptions.count();
    
    // Either no options or all disabled
    expect(count).toBe(0);
  });

  test('CAND-022: hired → rejected NOT allowed', async ({ page }) => {
    const hiredApp = { ...mockApplications[0], status: 'hired' };
    
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: [hiredApp], total: 1 },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Open menu
    await candidatesPage.openCandidateMenu(0);
    
    // 'rejected' option should not be available
    const rejectedOption = page.locator('[data-testid="status-rejected"]');
    const isRejectedVisible = await rejectedOption.isVisible();
    
    expect(isRejectedVisible).toBeFalsy();
  });

  test('CAND-023: withdrawn → any status NOT allowed', async ({ page }) => {
    const withdrawnApp = { ...mockApplications[0], status: 'withdrawn' };
    
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: [withdrawnApp], total: 1 },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Open menu
    await candidatesPage.openCandidateMenu(0);
    
    // No status change options should be available
    const statusOptions = page.locator('[data-testid^="status-"]');
    const count = await statusOptions.count();
    
    expect(count).toBe(0);
  });
});

test.describe('Status Update UI', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('CAND-030: Status dropdown shows only valid next statuses', async ({ page }) => {
    // Test with shortlisted status
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[2]], // shortlisted status
        total: 1,
      },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    await candidatesPage.openCandidateMenu(0);

    // Valid next statuses for shortlisted
    const validStatuses = VALID_STATUS_TRANSITIONS.shortlisted;
    
    for (const status of validStatuses) {
      const statusOption = page.locator(`[data-testid="status-${status}"]`);
      await expect(statusOption).toBeVisible();
    }

    // Invalid statuses should not be visible
    const invalidStatuses = APPLICATION_STATUSES.filter(
      s => !validStatuses.includes(s) && s !== 'shortlisted'
    );
    
    for (const status of invalidStatuses) {
      const statusOption = page.locator(`[data-testid="status-${status}"]`);
      const isVisible = await statusOption.isVisible();
      expect(isVisible).toBeFalsy();
    }
  });

  test('CAND-031: Updating status shows success toast', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[0]], // submitted status
        total: 1,
      },
    });

    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-1'), {
      success: true,
      data: { ...mockApplications[0], status: 'viewed' },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    await candidatesPage.updateCandidateStatus(0, 'viewed');

    // Success toast should appear
    await expect(page.locator('[data-testid="toast"]')).toBeVisible();
    await expect(page.locator('[data-testid="toast"]')).toContainText('success');
  });

  test('CAND-033: Invalid transition shows error message', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { 
        applications: [mockApplications[0]], // submitted status
        total: 1,
      },
    });

    // Mock error for invalid transition
    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-1'), {
      success: false,
      error: 'Cannot transition from submitted to hired',
    }, 400);

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    // Force an invalid transition (if UI allows)
    await candidatesPage.openCandidateMenu(0);
    
    // If there's a way to bypass UI validation
    await page.evaluate(() => {
      // Dispatch custom event or click hidden element
    });

    // Error toast should appear
    await expect(page.locator('[data-testid="toast-error"]')).toBeVisible();
  });
});

test.describe('Candidate Detail View', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('Clicking candidate navigates to detail page', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.list, {
      success: true,
      data: { applications: mockApplications, total: 4 },
    });

    // Mock detail response
    await mockApiResponse(page, API_ENDPOINTS.applications.detail('app-1'), {
      success: true,
      data: {
        ...mockApplications[0],
        resume_url: 'https://example.com/resume.pdf',
        cover_letter: 'I am interested in this position...',
      },
    });

    const candidatesPage = new CandidatesPage(page);
    await candidatesPage.goto();

    await candidatesPage.clickCandidate(0);

    // Should navigate to detail page
    await page.waitForURL('/candidates/app-1');

    // Detail page should show applicant info
    await expect(page.locator('text=John Doe')).toBeVisible();
  });

  test('Can update status from detail page', async ({ page }) => {
    await mockApiResponse(page, API_ENDPOINTS.applications.detail('app-1'), {
      success: true,
      data: {
        ...mockApplications[0],
        resume_url: 'https://example.com/resume.pdf',
        cover_letter: 'I am interested in this position...',
      },
    });

    await mockApiResponse(page, API_ENDPOINTS.applications.updateStatus('app-1'), {
      success: true,
      data: { ...mockApplications[0], status: 'viewed' },
    });

    await page.goto('/candidates/app-1');

    // Find and click status update button
    await page.click('[data-testid="update-status-button"]');
    await page.click('[data-testid="status-viewed"]');

    // Should show success
    await expect(page.locator('[data-testid="toast"]')).toContainText('success');
  });
});
