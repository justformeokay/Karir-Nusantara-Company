# Verification Status Update Fix

## Problem
Dashboard still showed "Menunggu Verifikasi" (Awaiting Verification) even after company was approved via admin API and `is_verified` was updated in the database.

## Root Cause
The frontend was storing company data only at login time. When the admin approved the company via the API, the frontend didn't know about the status change because:
1. The company data was cached in `authStore` at login
2. DashboardLayout never refreshed the company profile data
3. The banner component displayed the cached `verification_status`

## Solution Implemented

### 1. Updated DashboardLayout Component
**File:** `src/components/layout/DashboardLayout.tsx`

Added a `useEffect` hook that runs on component mount to refresh the company profile:
- Calls `authApi.getProfile()` to get latest company data from backend
- Updates the auth store with fresh data via `updateCompany()`
- This ensures any verification status changes are reflected immediately when user navigates to dashboard

```tsx
useEffect(() => {
  const refreshProfile = async () => {
    try {
      const response = await authApi.getProfile()
      if (response.success && response.data) {
        updateCompany(response.data)
      }
    } catch (error) {
      console.log('Profile refresh (non-blocking):', error)
    }
  }

  refreshProfile()
}, [updateCompany])
```

### 2. Verified API Endpoint
The backend already has the `/auth/me` endpoint that returns current user profile with latest `is_verified` status.

## How It Works Now

1. User logs in → Company data cached in authStore
2. Admin approves company via API → `is_verified` updated in database  
3. User navigates to dashboard → DashboardLayout triggers profile refresh
4. `getProfile()` calls `/auth/me` → Backend returns latest company data
5. `updateCompany()` updates authStore with fresh verification status
6. Banner component detects status change and hides itself
7. ✅ Dashboard now shows verified status immediately

## Files Modified
- `src/components/layout/DashboardLayout.tsx` - Added useEffect to refresh profile on mount
- `src/api/auth.ts` - Confirmed endpoint uses `/auth/me`

## Testing Steps
1. Create a company account and login
2. Note the "Menunggu Verifikasi" banner appears
3. Approve the company via admin API: `PATCH /api/v1/admin/companies/{id}/verify`
4. Refresh browser or navigate away and back to dashboard
5. ✅ Banner should disappear and dashboard shows verified status

## Why This Approach
- **Non-blocking:** Error is logged but doesn't break page load
- **Minimal:** Single focused change to one component
- **Efficient:** Only refresh happens on dashboard mount, not on every render
- **Compatible:** Uses existing `/auth/me` endpoint, no backend changes needed
