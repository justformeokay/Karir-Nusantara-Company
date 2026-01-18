# Test Suite - Karir Nusantara Company Dashboard

This document describes the automated test suite for the Karir Nusantara Company Dashboard application.

## 📁 Test Structure

```
tests/
├── TEST_CASES.md           # Complete test case documentation
├── e2e/                    # Playwright E2E tests
│   ├── fixtures.ts         # Test fixtures and helpers
│   ├── auth.setup.ts       # Authentication setup
│   ├── auth.spec.ts        # Authentication tests
│   ├── quota.spec.ts       # Job quota tests
│   ├── payment.spec.ts     # Payment flow tests
│   ├── candidates.spec.ts  # Candidate status tests
│   └── pages/              # Page Object Models
│       ├── index.ts
│       ├── LoginPage.ts
│       ├── DashboardPage.ts
│       ├── JobsPage.ts
│       ├── JobFormPage.ts
│       ├── CandidatesPage.ts
│       └── QuotaPage.ts
├── reports/                # Test reports (generated)
│   └── html/
└── test-results/           # Test artifacts (generated)
```

## 🚀 Quick Start

### Prerequisites

1. Install dependencies:
```bash
bun install
```

2. Install Playwright browsers:
```bash
bunx playwright install
```

### Running Tests

```bash
# Run all tests
bun run test

# Run tests with UI mode
bun run test:ui

# Run tests in headed mode (see the browser)
bun run test:headed

# Run tests in debug mode
bun run test:debug

# Run tests for specific browser
bun run test:chromium
bun run test:firefox
bun run test:webkit

# View test report
bun run test:report
```

## 🎯 Test Focus Areas

### 1. Authentication & Authorization (Priority: P0)
- Login/logout flows
- Registration
- Token management
- Permission boundaries (verified vs unverified companies)

### 2. Job Posting Quota (Priority: P0)
- Free quota tracking (5 initial quota)
- Quota consumption on job publish
- Quota NOT restored on job close
- Paid quota usage after free exhausted

### 3. Payment Flow (Priority: P1)
- Payment proof upload
- Payment status tracking (pending/confirmed/rejected)
- Quota increment after payment confirmation

### 4. Candidate Status Transitions (Priority: P0)
- Valid status transitions (submitted → viewed → shortlisted → ...)
- Invalid transition prevention
- Terminal states (hired, rejected, withdrawn)

## 📊 Test Case Summary

| Area | Total Tests | P0 | P1 | P2 |
|------|-------------|----|----|----| 
| Authentication | 15 | 12 | 3 | 0 |
| Quota | 12 | 9 | 3 | 0 |
| Payment | 14 | 8 | 5 | 1 |
| Candidates | 18 | 15 | 3 | 0 |
| Jobs | 12 | 9 | 3 | 0 |
| Dashboard | 8 | 4 | 4 | 0 |
| Profile | 6 | 2 | 3 | 1 |
| **Total** | **85** | **59** | **24** | **2** |

## 🔧 Configuration

### Environment Variables

```bash
# .env.test
BASE_URL=http://localhost:5174
API_URL=http://localhost:8081
```

### Test Users

| User | Email | Status | Quota |
|------|-------|--------|-------|
| Verified | test-verified@company.com | verified | 3/5 free |
| Unverified | test-unverified@company.com | pending | 5/5 free |
| Suspended | test-suspended@company.com | suspended | - |
| No Quota | test-noquota@company.com | verified | 0/5 free |

Password for all: `TestPassword123!`

## 🏗️ Page Object Model

The tests use the Page Object Model pattern for maintainability:

```typescript
import { LoginPage, DashboardPage } from './pages';

test('login flow', async ({ page }) => {
  const loginPage = new LoginPage(page);
  await loginPage.goto();
  await loginPage.login('email@test.com', 'password');
  
  const dashboard = new DashboardPage(page);
  await dashboard.expectStatsLoaded();
});
```

## 🔌 API Mocking

Tests can mock API responses for isolation:

```typescript
import { mockApiResponse, API_ENDPOINTS } from './fixtures';

test('handle error', async ({ page }) => {
  await mockApiResponse(page, API_ENDPOINTS.auth.login, {
    success: false,
    error: 'Invalid credentials',
  }, 401);
  
  // Test error handling...
});
```

## 📈 CI/CD Integration

Tests run automatically on:
- Push to `main` or `develop`
- Pull requests to `main` or `develop`

See `.github/workflows/ci.yml` for the complete CI/CD pipeline.

### Coverage Targets

| Level | Target |
|-------|--------|
| E2E Critical Paths | 100% |
| API Integration | 90% |
| Unit Tests | 80% |

## 🐛 Debugging Failed Tests

1. **View trace**: Playwright records traces on first retry
```bash
bunx playwright show-trace tests/test-results/path-to-trace.zip
```

2. **Run in debug mode**:
```bash
bun run test:debug
```

3. **Run specific test**:
```bash
bunx playwright test auth.spec.ts --headed
```

## 📝 Writing New Tests

1. Create test file in `tests/e2e/`
2. Use existing page objects or create new ones
3. Follow naming convention: `[feature].spec.ts`
4. Add test cases to `TEST_CASES.md`

Example:
```typescript
import { test, expect } from '@playwright/test';
import { TEST_USERS, STORAGE_STATE } from './fixtures';
import { DashboardPage } from './pages';

test.describe('My Feature', () => {
  test.use({ storageState: STORAGE_STATE.verified });

  test('should do something', async ({ page }) => {
    const dashboard = new DashboardPage(page);
    await dashboard.goto();
    // assertions...
  });
});
```

## 🔗 Related Documentation

- [Test Cases](./TEST_CASES.md) - Detailed test case list
- [API Documentation](../karir-nusantara-api/docs/API_DOCUMENTATION.md)
- [Project Overview](./documentations/PROJECT_OVERVIEW.md)
