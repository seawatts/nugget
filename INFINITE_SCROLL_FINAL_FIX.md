# Infinite Scroll - Final Fixes

## Issue: Nothing Shows Up on Refresh

### Root Cause
Three interconnected problems were preventing data from loading properly:

1. **Missing babyId prop**: Component was refactored to accept `babyId` as prop, but parent wasn't passing it
2. **Overly aggressive invalidation detection**: Tracking too many query states (including prediction queries) caused false positives during initial load
3. **Premature refetch triggers**: Invalidation logic was running before initial load completed

## Fixes Applied

### 1. Pass babyId Prop from Parent ✅

**File**: `apps/web-app/src/app/(app)/app/babies/[babyId]/dashboard/_components/dashboard-container.tsx`

```typescript
// Before
<ActivityTimeline />

// After
<ActivityTimeline babyId={babyId} />
```

### 2. Added babyId to Server Action Schema ✅

**File**: `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.actions.ts`

```typescript
const getActivitiesInputSchema = z.object({
  activityTypes: z.array(z.string()).optional(),
  babyId: z.string(), // ← Added this
  itemTypes: z.array(z.enum(['activity', 'milestone', 'chat'])).optional(),
  limit: z.number().min(1).max(100).default(30),
  cursor: z.string().optional(),
  userIds: z.array(z.string()).optional(),
});
```

### 3. Verify Baby Ownership ✅

**File**: `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.actions.ts`

```typescript
// Verify baby belongs to user's family
const babyCheck = await db.query.Babies.findFirst({
  where: and(
    eq(Babies.id, babyId),
    eq(Babies.familyId, authResult.orgId),
  ),
});

if (!babyCheck) {
  throw new Error('Baby not found or does not belong to your family');
}
```

### 4. Simplified Invalidation Detection ✅

**File**: `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.tsx`

**Problem**: Was tracking prediction queries which are undefined during initial load, causing false positive invalidations

```typescript
// BEFORE - Caused false positives
const feedingPredictionState = utils.activities.getUpcomingFeeding.getData();
const sleepPredictionState = utils.activities.getUpcomingSleep.getData();
// ... etc

const dataQueryKey = JSON.stringify({
  activities: activitiesQueryState,
  feeding: feedingPredictionState?.recentActivities?.length, // ← undefined on load!
  sleep: sleepPredictionState?.recentActivities?.length,
  // ...
});
```

```typescript
// AFTER - Only tracks core data states
const dataQueryKey = useMemo(() => {
  const timestamp = Date.now();
  return JSON.stringify({
    activities: activitiesQueryState ? timestamp : null,
    chats: chatsQueryState ? timestamp : null,
    milestones: milestonesQueryState ? timestamp : null,
  });
}, [activitiesQueryState, milestonesQueryState, chatsQueryState]);
```

**Why this works**:
- Uses timestamp-based approach to detect any changes to query state
- Ignores undefined/null states during initial load
- Only triggers refetch when queries have actually been populated and then invalidated

### 5. Guard Against Premature Refetch ✅

**File**: `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.tsx`

```typescript
const prevDataKeyRef = useRef<string | null>(null);
const hasCompletedInitialLoadRef = useRef(false); // ← Track initial load completion

useEffect(() => {
  // Skip until we've completed at least one successful load
  if (
    hasCompletedInitialLoadRef.current && // ← Only after initial load completes
    prevDataKeyRef.current &&
    prevDataKeyRef.current !== dataQueryKey &&
    timelineFilters &&
    !isPending &&
    !isFetchingNextPage &&
    pages.length > 0 // ← Only refetch if we have data
  ) {
    // Silently refetch first page
    execute(timelineFilters).then((result) => {
      if (result?.data) {
        setPages((prev) => {
          const newPages = [...prev];
          newPages[0] = result.data;
          return newPages;
        });
        setCurrentCursor(result.data.nextCursor);
      }
    });
  }
  prevDataKeyRef.current = dataQueryKey;
}, [dataQueryKey]);
```

**Key addition**: `hasCompletedInitialLoadRef` is set to `true` only after the first successful load completes. This prevents the invalidation detection from running during initial mount.

## How It Works Now

### Initial Page Load
1. Component mounts with `babyId` prop
2. `timelineFilters` is computed
3. Initial `execute()` is triggered
4. `hasCompletedInitialLoadRef` is set to `true` after data loads
5. Timeline displays with data

### After Creating Activity
1. Mutation calls `utils.activities.invalidate()`
2. tRPC query cache updates
3. `activitiesQueryState` changes
4. `dataQueryKey` changes (timestamp updates)
5. Invalidation effect triggers (because `hasCompletedInitialLoadRef.current === true`)
6. First page is silently refetched
7. New activity appears in timeline

### On Page Refresh
1. Component remounts
2. Query states start as `undefined`
3. `dataQueryKey` returns `null` values for undefined states
4. Initial load completes
5. `hasCompletedInitialLoadRef` set to `true`
6. Ready to detect future invalidations

## Files Modified

1. ✅ `apps/web-app/src/app/(app)/app/babies/[babyId]/dashboard/_components/dashboard-container.tsx`
   - Pass `babyId` prop to ActivityTimeline

2. ✅ `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.actions.ts`
   - Add `babyId` to schema
   - Add `Babies` import
   - Add baby ownership verification
   - Use `babyId` in all queries

3. ✅ `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.tsx`
   - Accept `babyId` as required prop
   - Simplified invalidation detection
   - Added `hasCompletedInitialLoadRef` guard
   - Fixed premature refetch triggers

## Testing Checklist

- [x] No linter errors
- [x] TypeScript compilation successful
- [ ] Initial load shows activities
- [ ] Page refresh maintains data
- [ ] Creating activity updates timeline immediately
- [ ] Scroll position maintained during infinite scroll
- [ ] Filters work correctly

## Key Learnings

1. **Track initial load completion**: Prevent state management hooks from running before component is ready
2. **Handle undefined states**: Query states are undefined during initial mount - design around this
3. **Use timestamp-based invalidation**: More reliable than tracking actual data values
4. **Guard all refetch logic**: Always check that initial load is complete before running automatic refetches

