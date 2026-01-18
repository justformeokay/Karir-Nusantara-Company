# Test Cases - Karir Nusantara Company Dashboard

## 1. Authentication & Authorization Tests

### 1.1 Login Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| AUTH-001 | Login with valid credentials redirects to dashboard | P0 | E2E |
| AUTH-002 | Login with invalid email shows error message | P0 | E2E |
| AUTH-003 | Login with wrong password shows error message | P0 | E2E |
| AUTH-004 | Login with unverified company shows limited access | P0 | E2E |
| AUTH-005 | JWT token is stored after successful login | P0 | E2E |
| AUTH-006 | Expired token triggers refresh flow | P1 | API |
| AUTH-007 | Invalid token returns 401 Unauthorized | P0 | API |

### 1.2 Registration Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| AUTH-010 | Register with valid data creates pending company | P0 | E2E |
| AUTH-011 | Register with existing email shows error | P0 | E2E |
| AUTH-012 | Register without required fields shows validation errors | P0 | E2E |
| AUTH-013 | New company starts with pending verification status | P0 | API |

### 1.3 Permission Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| AUTH-020 | Unverified company cannot create jobs | P0 | E2E + API |
| AUTH-021 | Verified company can create jobs | P0 | E2E + API |
| AUTH-022 | Company can only see own jobs | P0 | API |
| AUTH-023 | Company can only see own applications | P0 | API |
| AUTH-024 | Suspended company cannot access dashboard | P0 | E2E + API |

---

## 2. Job Posting Quota Tests

### 2.1 Free Quota Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| QUOTA-001 | New company starts with 5 free quota | P0 | API |
| QUOTA-002 | Publishing job decrements free quota by 1 | P0 | API |
| QUOTA-003 | Closing job does NOT restore free quota | P1 | API |
| QUOTA-004 | Deleting draft job does NOT affect quota | P1 | API |
| QUOTA-005 | Dashboard shows correct remaining quota | P0 | E2E |

### 2.2 Quota Exhaustion Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| QUOTA-010 | Company with 0 free quota sees payment required | P0 | E2E |
| QUOTA-011 | Publishing job with 0 quota shows payment dialog | P0 | E2E |
| QUOTA-012 | API rejects publish when quota is 0 | P0 | API |

### 2.3 Paid Quota Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| QUOTA-020 | Confirmed payment adds paid quota | P0 | API |
| QUOTA-021 | Publishing uses paid quota after free exhausted | P0 | API |
| QUOTA-022 | Quota page shows correct paid quota count | P0 | E2E |

---

## 3. Payment Flow Tests

### 3.1 Payment Proof Upload Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| PAY-001 | Upload payment proof with valid image succeeds | P0 | E2E |
| PAY-002 | Upload file exceeding 5MB shows error | P1 | E2E |
| PAY-003 | Upload non-image file shows error | P1 | E2E |
| PAY-004 | Proof is stored with pending status | P0 | API |
| PAY-005 | Payment history shows uploaded proofs | P0 | E2E |

### 3.2 Payment Status Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| PAY-010 | Pending payment shows waiting status | P0 | E2E |
| PAY-011 | Confirmed payment shows confirmed status | P0 | E2E |
| PAY-012 | Rejected payment shows rejected status with note | P0 | E2E |
| PAY-013 | Confirmed payment triggers quota increment | P0 | API |

### 3.3 Payment Info Display Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| PAY-020 | Payment page shows bank account details | P0 | E2E |
| PAY-021 | Copy account number works correctly | P1 | E2E |
| PAY-022 | Price per job is displayed correctly | P0 | E2E |

---

## 4. Candidate Status Transition Tests

### 4.1 Valid Transitions
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| CAND-001 | submitted → viewed transition allowed | P0 | API |
| CAND-002 | viewed → shortlisted transition allowed | P0 | API |
| CAND-003 | shortlisted → interview_scheduled allowed | P0 | API |
| CAND-004 | interview_scheduled → interview_completed allowed | P0 | API |
| CAND-005 | interview_completed → offer_sent allowed | P0 | API |
| CAND-006 | offer_sent → offer_accepted allowed | P0 | API |
| CAND-007 | offer_accepted → hired allowed | P0 | API |
| CAND-008 | Any status → rejected allowed | P0 | API |
| CAND-009 | Any status → withdrawn allowed (by candidate) | P1 | API |

### 4.2 Invalid Transitions
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| CAND-020 | submitted → hired directly NOT allowed | P0 | API |
| CAND-021 | rejected → any status NOT allowed | P0 | API |
| CAND-022 | hired → rejected NOT allowed | P0 | API |
| CAND-023 | withdrawn → any status NOT allowed | P0 | API |

### 4.3 Status Update UI Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| CAND-030 | Status dropdown shows only valid next statuses | P0 | E2E |
| CAND-031 | Updating status shows success toast | P0 | E2E |
| CAND-032 | Status history shows all transitions | P1 | E2E |
| CAND-033 | Invalid transition shows error message | P0 | E2E |

---

## 5. Job Management Tests

### 5.1 Job Creation Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| JOB-001 | Create job with all required fields succeeds | P0 | E2E |
| JOB-002 | Create job without required fields shows errors | P0 | E2E |
| JOB-003 | Save as draft does not consume quota | P0 | E2E + API |
| JOB-004 | Publish job consumes quota | P0 | E2E + API |
| JOB-005 | Created job appears in job list | P0 | E2E |

### 5.2 Job Status Management Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| JOB-010 | draft → active (publish) allowed | P0 | API |
| JOB-011 | active → paused allowed | P0 | API |
| JOB-012 | active → closed allowed | P0 | API |
| JOB-013 | paused → active (reopen) allowed | P0 | API |
| JOB-014 | closed → active (reopen) allowed | P0 | API |
| JOB-015 | active → filled allowed | P1 | API |

### 5.3 Job Deletion Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| JOB-020 | Delete draft job succeeds | P0 | E2E |
| JOB-021 | Delete active job shows confirmation | P0 | E2E |
| JOB-022 | Deleted job removed from list | P0 | E2E |

---

## 6. Dashboard Tests

### 6.1 Statistics Display Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| DASH-001 | Active jobs count is accurate | P0 | E2E |
| DASH-002 | Total applicants count is accurate | P0 | E2E |
| DASH-003 | Under review count is accurate | P0 | E2E |
| DASH-004 | Accepted candidates count is accurate | P0 | E2E |

### 6.2 Recent Data Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| DASH-010 | Recent applicants list shows latest 5 | P1 | E2E |
| DASH-011 | Active jobs list shows correct data | P1 | E2E |
| DASH-012 | Clicking applicant navigates to detail | P1 | E2E |
| DASH-013 | Clicking job navigates to detail | P1 | E2E |

---

## 7. Company Profile Tests

### 7.1 Profile Update Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| PROF-001 | Update company name succeeds | P1 | E2E |
| PROF-002 | Upload company logo succeeds | P1 | E2E |
| PROF-003 | Logo exceeding 2MB shows error | P2 | E2E |
| PROF-004 | Profile changes reflected immediately | P1 | E2E |

### 7.2 Verification Status Tests
| ID | Test Case | Priority | Type |
|----|-----------|----------|------|
| PROF-010 | Pending status shows waiting banner | P0 | E2E |
| PROF-011 | Rejected status shows resubmit option | P1 | E2E |
| PROF-012 | Verified status shows verified badge | P0 | E2E |
