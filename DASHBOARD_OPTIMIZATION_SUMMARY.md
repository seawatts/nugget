# Dashboard Loading Optimization - Implementation Summary

## Problem Identified

The baby dashboard was loading the same data multiple times (~20+ network requests) because each component independently fetched shared data:
- `api.user.current.useQuery()` called in 6+ components
- `api.activities.list.useQuery()` called in 5+ components with similar parameters
- Each predictive card making separate prediction queries

This caused:
- Excessive network requests visible in browser DevTools
- Waterfall effect with sequential rendering
- Slower perceived performance

## Solution Implemented

Created a **Zustand dashboard data store** to share common data across all dashboard components, eliminating redundant API calls while maintaining Suspense and avoiding prop drilling.

## Changes Made

### 1. Created Dashboard Data Store
**File:** `apps/web-app/src/stores/dashboard-data.ts`

- New Zustand store with state for: `baby`, `user`, and `activities` (last 30 days)
- Actions: `setBaby()`, `setUser()`, `setActivities()`, `clear()`
- Auto-generated selectors using `createSelectors()` utility
- Follows the same pattern as existing `optimistic-activities` store

### 2. Updated DashboardContainer
**File:** `apps/web-app/src/app/(app)/app/babies/[babyId]/dashboard/_components/dashboard-container.tsx`

- Added suspense query for `api.activities.list` (last 30 days)
- Populates dashboard store via `useEffect` when data loads
- Clears store on unmount

### 3. Updated ActivityCards
**File:** `apps/web-app/src/app/(app)/app/_components/activities/activity-cards.tsx`

- Replaced `api.babies.getByIdLight.useQuery()` with `useDashboardDataStore.use.baby()`
- Removed conditional query logic

### 4. Updated All Predictive Cards
**Files Updated:**
- `predictive-feeding-card.tsx`
- `quick-action-feeding-card.tsx`
- `predictive-sleep-card.tsx`
- `predictive-diaper-card.tsx`
- `predictive-pumping-card.tsx`
- `predictive-vitamin-d-card.tsx`

Changes in each:
- Replaced `api.user.current.useQuery()` with `useDashboardDataStore.use.user()`
- Replaced `api.babies.getByIdLight.useQuery()` with `useDashboardDataStore.use.baby()` (where applicable)
- Replaced `api.activities.list.useQuery()` with `useDashboardDataStore.use.activities()`
- For Vitamin D card: Filters activities client-side from the shared store data
- Removed duplicate imports that are no longer needed
- Kept card-specific prediction queries (these are unique to each card)

### 5. Updated TodaySummaryCard
**File:** `apps/web-app/src/app/(app)/app/_components/today-summary-card.tsx`

- Replaced `api.babies.getMostRecent.useSuspenseQuery()` with `useDashboardDataStore.use.baby()`
- Replaced `api.activities.list.useSuspenseQuery()` with `useDashboardDataStore.use.activities()`
- Kept milestone query (not shared data)

## Expected Results

### Network Request Reduction
**Before:** ~22+ requests
- 6+ calls to `/user/current`
- 5+ calls to `/activities/list` with similar parameters
- 4+ calls to `/babies/getByIdLight` (including LearningCarousel & MilestonesCarousel)
- 1 call per predictive card for predictions (kept)
- Other unique queries

**After:** ~8-10 requests
- 1 call to `/user/current` (via DashboardContainer)
- 1 call to `/activities/list` (via DashboardContainer)
- 1 call to `/babies/getByIdLight` (via DashboardContainer)
- 1 call per predictive card for predictions (kept - these are unique)
- Other unique queries

**Total reduction**: ~65% fewer network requests

### Performance Improvements
- Faster initial page load
- Reduced waterfall effect
- More efficient re-renders (only components using specific selectors update)
- Maintains Suspense loading states

## Testing Instructions

1. **Open Browser DevTools Network Tab**
   - Navigate to `/app/babies/[babyId]/dashboard`
   - Filter for "fetch" or "XHR" requests
   - Look for the server action reducer and tRPC endpoints

2. **Verify Reduced Requests**
   - Should see **single request** for user data
   - Should see **single request** for activities list (30 days)
   - Should still see **one request per predictive card** for predictions (this is expected)
   - Total requests should be ~8-10 instead of ~20+

3. **Verify Functionality**
   - All predictive cards should display correctly
   - Quick action buttons should work
   - Activity timeline should load
   - Today's summary should show correct data
   - All stats and goals should calculate correctly

4. **Test Edge Cases**
   - Navigate to dashboard multiple times
   - Switch between babies
   - Create new activities and verify optimistic updates
   - Ensure store clears properly when leaving dashboard

## Data Flow

```
Server (page.tsx)
  ↓ Prefetch queries
DashboardContainer
  ↓ Suspense queries resolve
  ↓ useEffect populates Zustand store
Zustand Dashboard Store
  ↓ Components access via selectors
All child components get data efficiently
  ↓ Each component only fetches component-specific data
Efficient re-renders (only affected components update)
```

## Benefits

✅ **No prop drilling** - Direct store access
✅ **Efficient re-renders** - Only components using specific selectors re-render
✅ **Consistent pattern** - Matches existing `optimistic-activities` store
✅ **Better performance** - ~60% reduction in network requests
✅ **Cleaner code** - No context boilerplate
✅ **DevTools support** - Debug state with Zustand DevTools
✅ **Maintains Suspense** - DashboardContainer still uses suspense queries

## Files Modified

1. `apps/web-app/src/stores/dashboard-data.ts` (NEW)
2. `apps/web-app/src/app/(app)/app/babies/[babyId]/dashboard/_components/dashboard-container.tsx`
3. `apps/web-app/src/app/(app)/app/_components/activities/activity-cards.tsx`
4. `apps/web-app/src/app/(app)/app/_components/activities/feeding/predictive-feeding-card.tsx`
5. `apps/web-app/src/app/(app)/app/_components/activities/feeding/quick-action-feeding-card.tsx`
6. `apps/web-app/src/app/(app)/app/_components/activities/sleep/predictive-sleep-card.tsx`
7. `apps/web-app/src/app/(app)/app/_components/activities/diaper/predictive-diaper-card.tsx`
8. `apps/web-app/src/app/(app)/app/_components/activities/pumping/predictive-pumping-card.tsx`
9. `apps/web-app/src/app/(app)/app/_components/activities/vitamin-d/predictive-vitamin-d-card.tsx`
10. `apps/web-app/src/app/(app)/app/_components/today-summary-card.tsx`
11. `apps/web-app/src/app/(app)/app/_components/learning/learning-carousel.tsx`
12. `apps/web-app/src/app/(app)/app/_components/milestones/milestones-carousel.tsx`

## Next Steps

1. Test the dashboard in development
2. Monitor network requests in DevTools
3. Verify all functionality works as expected
4. Check for any edge cases
5. Consider adding similar optimization for other pages if needed

