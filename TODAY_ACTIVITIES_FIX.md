# Today's Activities Not Showing - Root Cause & Fix

## The Problem

Activities created "today" were not appearing in the timeline - only yesterday's and older activities showed up.

## Root Cause Discovered

From the console logs:

```
[Server] Activities query result: {
  count: 90,
  cursorDate: '2025-11-23T05:02:53.772Z',  ← HAD A CURSOR!
  firstActivity: {
    startTime: 2025-11-23T03:54:53.772Z,    ← OLDER than cursor
    startTimeISO: '2025-11-23T03:54:53.772Z',
    type: 'sleep'
  }
}

[browser] Timeline grouping - sample dates: {
  firstItem: {
    iso: '2025-11-23T03:54:53.772Z',
    local: '11/22/2025, 7:54:53 PM',         ← Shows as YESTERDAY
    isToday: false,
    isYesterday: true                        ← Correctly identified as yesterday
  },
  now: {
    iso: '2025-11-23T18:37:13.066Z',
    local: '11/23/2025, 10:37:13 AM'         ← Current time is TODAY
  },
  todayStart: '2025-11-23T08:00:00.000Z',
  totalItems: 30
}
```

### The Issue

1. **Query had a cursor**: When refetching after invalidation, it passed `cursorDate: '2025-11-23T05:02:53.772Z'`
2. **Cursor filters for older items**: The query uses `lt(ActivitiesTable.startTime, cursorDate)` which means "less than cursor"
3. **New activities excluded**: Any activities created after that cursor time were filtered out
4. **Only old activities returned**: Server returned activities OLDER than 5:02 AM today (which are yesterday in PST)

## The Fix

**File**: `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.tsx`

Changed the invalidation refetch logic to:
1. **Reset the state completely** - Clear pages and cursor
2. **Fetch without cursor** - Get the NEWEST items, not older ones
3. **Treat as initial load** - Set `isInitialLoadRef.current = true`

```typescript
// Before (WRONG)
if (hasCompletedInitialLoadRef.current && ...) {
  execute(timelineFilters).then((result) => {
    if (result?.data) {
      setPages((prev) => {
        const newPages = [...prev];
        newPages[0] = result.data;  // Kept old cursor!
        return newPages;
      });
      setCurrentCursor(result.data.nextCursor);  // Used old cursor!
    }
  });
}

// After (CORRECT)
if (hasCompletedInitialLoadRef.current && ...) {
  console.log('[Invalidation] Refetching first page without cursor to get newest items');
  // Reset pages to force fresh fetch WITHOUT cursor
  setPages([]);
  setCurrentCursor(null);  // ← Clear cursor!
  isInitialLoadRef.current = true;
  execute(timelineFilters);  // ← Fetches newest items
}
```

## Why This Works

### Cursor-Based Pagination Behavior

The server action uses cursor-based pagination:

```typescript
// If cursor exists, fetch items OLDER than cursor
if (cursorDate) {
  activityConditions.push(lt(ActivitiesTable.startTime, cursorDate));
}
```

**For infinite scroll** (loading older items):
- User scrolls down → Pass cursor → Get older items ✅

**For invalidation** (getting new items):
- Activity created → Invalidate → Need NEWEST items
- Passing cursor → Gets OLDER items ❌
- **Solution**: Clear cursor → Gets NEWEST items ✅

## Timeline of Events

### Before Fix
1. Page loads → Fetch newest 30 items
2. User scrolls → Cursor set to oldest item's timestamp
3. User creates activity TODAY at 10:30 AM
4. Invalidation triggers
5. Refetch with OLD cursor (5:02 AM)
6. Query returns items OLDER than 5:02 AM
7. New 10:30 AM activity NOT in results ❌

### After Fix
1. Page loads → Fetch newest 30 items
2. User scrolls → Cursor set to oldest item's timestamp
3. User creates activity TODAY at 10:30 AM
4. Invalidation triggers
5. **Reset cursor to null**
6. Refetch WITHOUT cursor
7. Query returns NEWEST 30 items
8. New 10:30 AM activity IS in results ✅

## Testing

Now when you:
1. **Create a new activity** → It appears immediately under "Today"
2. **Refresh the page** → Today's activities still show
3. **Scroll down** → Older activities load correctly

## Additional Changes Made

Added debug logging to help diagnose:
- **Server-side**: Shows what query is executed and what data is returned
- **Client-side**: Shows how dates are being evaluated by `isToday()`

These logs revealed:
- The cursor was being passed on invalidation
- Activities were being filtered to only older items
- Timezone handling was actually working correctly

## Key Learnings

1. **Cursor pagination direction**: Cursors fetch OLDER items, not newer ones
2. **Invalidation needs reset**: When data changes, reset pagination state completely
3. **Debug logging is critical**: Without logs, this would have been very hard to diagnose
4. **date-fns handles timezones**: `isToday()` and `isYesterday()` work correctly with proper Date objects

## Files Modified

1. ✅ `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.tsx`
   - Fixed invalidation refetch to clear cursor
   - Added debug logging

2. ✅ `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.actions.ts`
   - Added server-side debug logging
   - Improved date conversion handling

## Status

🎯 **FIXED**: Today's activities will now appear in the timeline!









