# Test Strategy - Karir Nusantara Company Dashboard

## 1. Overview

This document outlines the comprehensive test strategy for the Karir Nusantara Company Dashboard application, covering both frontend (E2E) and backend (API) testing.

## 2. Test Pyramid

```
        /\
       /  \  E2E Tests (Playwright)
      /----\  - Critical user journeys
     /      \ - Happy path scenarios
    /--------\
   /          \  Integration Tests
  /------------\  - API endpoint tests
 /              \ - Database integration
/----------------\
|  Unit Tests    | - Component tests
|  (Vitest)      | - Utility functions
------------------
```

## 3. Test Scope

### 3.1 Focus Areas (Priority Order)

| Priority | Area | Type | Tool |
|----------|------|------|------|
| P0 | Authentication & Authorization | E2E + API | Playwright + Go |
| P0 | Job Posting Quota Logic | E2E + API | Playwright + Go |
| P1 | Payment Flow | E2E + API | Playwright + Go |
| P1 | Candidate Status Transitions | E2E + API | Playwright + Go |
| P2 | Dashboard Statistics | E2E | Playwright |
| P2 | Company Profile Management | E2E | Playwright |

### 3.2 Test Types

#### E2E Tests (Playwright)
- **Auth Flow**: Login, Register, Logout, Password Reset
- **Job Management**: Create, Edit, Publish, Close, Delete jobs
- **Candidate Management**: View, Update status, Filter
- **Quota & Payment**: View quota, Upload payment proof
- **Company Profile**: Update profile, Logo upload

#### API Tests (Go)
- **Auth Endpoints**: Token validation, Refresh token
- **Job Endpoints**: CRUD operations, Status transitions
- **Application Endpoints**: Status update validation
- **Quota Endpoints**: Quota calculation, Payment verification
- **Permission Tests**: Role-based access control

## 4. Test Data Strategy

### 4.1 Test Users
| Role | Email | Purpose |
|------|-------|---------|
| Verified Company | company.verified@test.com | Full access testing |
| Pending Company | company.pending@test.com | Limited access testing |
| Rejected Company | company.rejected@test.com | Blocked access testing |

### 4.2 Test Data Setup
- Use database seeding for consistent test data
- API tests use isolated test database
- E2E tests use test fixtures

## 5. Environment Strategy

| Environment | Purpose | Data |
|-------------|---------|------|
| Local | Development testing | Mock data |
| CI/CD | Automated test runs | Seeded test data |
| Staging | Pre-production validation | Production-like data |

## 6. CI/CD Integration

```yaml
# GitHub Actions workflow stages
1. Install dependencies
2. Run unit tests (Vitest)
3. Run API tests (Go test)
4. Start test server
5. Run E2E tests (Playwright)
6. Generate coverage reports
7. Upload artifacts
```

## 7. Test Naming Convention

```
[Feature].[Scenario].[ExpectedResult]

Examples:
- auth.login.shouldRedirectToDashboard
- job.createWithFreeQuota.shouldSucceed
- payment.uploadProof.shouldShowPendingStatus
- candidate.updateStatus.shouldValidateTransition
```

## 8. Coverage Targets

| Type | Target | Current |
|------|--------|---------|
| Unit Tests | 80% | - |
| API Tests | 90% | - |
| E2E Critical Paths | 100% | - |

## 9. Risk-Based Testing

### High Risk (Extensive Testing)
- Payment processing logic
- Quota deduction/addition
- Application status transitions
- Authentication/authorization

### Medium Risk (Standard Testing)
- Job CRUD operations
- Dashboard statistics
- Company profile updates

### Low Risk (Smoke Testing)
- Static pages
- UI styling
- Non-critical notifications
