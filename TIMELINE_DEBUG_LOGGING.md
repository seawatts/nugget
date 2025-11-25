# Timeline Debug Logging Guide

Debug logging has been added to the Activity Timeline component to help diagnose why activities aren't showing up in the browser.

## What Was Added

### 1. Component Initialization Logging

**Location:** Top of `ActivityTimeline` component
**Log Tag:** `[Timeline Debug]`

Logs:
- Component render with `babyId`
- Number of optimistic activities from Zustand store

```typescript
console.log('[Timeline Debug] Component render, babyId:', babyId);
console.log('[Timeline Debug] Optimistic activities:', optimisticActivities.length);
```

### 2. Filter Construction Logging

**Location:** `useEffect` that monitors filter changes
**Log Tag:** `[Timeline Debug]`

Logs:
- When filters are ready (or not ready)
- Filter values being sent to server action
- When filters change triggering a data fetch

```typescript
console.log('[Timeline Debug] Filters not ready yet');
console.log('[Timeline Debug] Filters:', timelineFilters);
console.log('[Timeline Debug] Filters changed or initial load, fetching data...');
```

### 3. Server Action Response Logging

**Location:** `useEffect` that handles `getActivitiesAction` results
**Log Tag:** `[Timeline Debug]`

Logs:
- When server action succeeds
- Number of items returned
- Next cursor value
- Sample of first 3 items (type and timestamp)
- Whether this is initial load or pagination

```typescript
console.log('[Timeline Debug] Server action succeeded:', {
  itemCount: result.data.items.length,
  nextCursor: result.data.nextCursor,
  sampleItems: result.data.items.slice(0, 3),
});
```

### 4. Data Flattening Logging

**Location:** `serverTimelineItems` useMemo
**Log Tag:** `[Timeline Debug]`

Logs:
- Total number of pages received
- Total number of items after flattening and timestamp validation
- Sample of first 3 items

```typescript
console.log('[Timeline Debug] Server items after flattening/filtering:', {
  totalPages: pages.length,
  totalItems: flattened.length,
  sampleItems: flattened.slice(0, 3),
});
```

### 5. Data Merging & Filtering Logging

**Location:** `allTimelineItems` useMemo
**Log Tag:** `[Timeline Debug]`

Logs:
- Counts before merging (optimistic vs server items)
- Selected activity types filter
- Count after deduplication
- Filter configuration (showSkipped)
- Any skipped activities that are filtered out
- Final count after all filters applied
- Sample of first 3 final items

```typescript
console.log('[Timeline Debug] Merging items:', {
  optimisticCount: optimisticTimelineItems.length,
  serverCount: serverTimelineItems.length,
  selectedActivityTypes,
});
console.log('[Timeline Debug] Final timeline items:', {
  filteredCount: filtered.length,
  sortedCount: sorted.length,
  sampleItems: sorted.slice(0, 3),
});
```

### 6. Grouping by Day Logging

**Location:** `groupTimelineItemsByDay` function
**Log Tag:** `Timeline grouping - sample dates`

Logs:
- Total number of items to group
- First item's timestamp details (ISO, local, validity, isToday, isYesterday)
- Current time and todayStart
- Day labels after grouping (Today, Yesterday, etc.)

```typescript
console.log('Timeline grouping - sample dates:', {
  firstItem: { timestamp, isToday, isYesterday, ... },
  now: { current, iso, local },
  totalItems: items.length,
});
console.log('Timeline grouped by day:', Array.from(grouped.keys()));
```

### 7. Pre-Render State Logging

**Location:** Right before component returns JSX
**Log Tag:** `[Timeline Debug]`

Logs:
- Complete rendering state including:
  - `isPending` - Whether server action is in progress
  - `pagesCount` - Number of pages fetched
  - `isFetchingNextPage` - Whether pagination is happening
  - `allTimelineItemsCount` - Total items after all processing
  - `groupedItemsSize` - Number of day groups
  - `groupedKeys` - Array of day labels
  - `hasSucceeded` - Whether last fetch succeeded
  - `currentCursor` - Pagination cursor

```typescript
console.log('[Timeline Debug] Rendering state:', {
  isPending,
  pagesCount: pages.length,
  isFetchingNextPage,
  allTimelineItemsCount: allTimelineItems.length,
  groupedItemsSize: groupedItems.size,
  groupedKeys: Array.from(groupedItems.keys()),
  hasSucceeded,
  currentCursor,
});
```

## How to Use This Logging

### Step 1: Open Browser DevTools
1. Open the app in your browser
2. Press `F12` or `Cmd+Option+I` (Mac) / `Ctrl+Shift+I` (Windows/Linux)
3. Go to the **Console** tab

### Step 2: Navigate to Timeline
1. Go to the page with the timeline (`/app`)
2. Watch the console logs appear

### Step 3: Analyze the Logs

Look for these key indicators:

#### ✅ **Everything Working (Expected Logs)**
```
[Timeline Debug] Component render, babyId: baby_a2wr6cnjrxinbe6m0ihgnvef
[Timeline Debug] Optimistic activities: 0
[Timeline Debug] Filters: { babyId: "baby_...", limit: 30, itemTypes: [...] }
[Timeline Debug] Filters changed or initial load, fetching data...
[Timeline Debug] Server action succeeded: { itemCount: 5, nextCursor: null, ... }
[Timeline Debug] Server items after flattening/filtering: { totalPages: 1, totalItems: 5, ... }
[Timeline Debug] Merging items: { optimisticCount: 0, serverCount: 5, ... }
[Timeline Debug] Final timeline items: { sortedCount: 5, sampleItems: [...] }
Timeline grouping - sample dates: { firstItem: {...}, totalItems: 5 }
Timeline grouped by day: ["Today", "Yesterday"]
[Timeline Debug] Rendering state: { allTimelineItemsCount: 5, groupedItemsSize: 2, ... }
```

#### ❌ **Problem: No Data Returned**
```
[Timeline Debug] Server action succeeded: { itemCount: 0, nextCursor: null }
```
**Diagnosis:** Backend is returning empty results. Check filters, babyId, or permissions.

#### ❌ **Problem: Data Filtered Out**
```
[Timeline Debug] Server items: { totalItems: 5 }
[Timeline Debug] Final timeline items: { sortedCount: 0 }
```
**Diagnosis:** Client-side filtering is removing all items. Check `selectedActivityTypes` and skipped filter.

#### ❌ **Problem: Invalid Timestamps**
```
Filtered out server timeline item with invalid timestamp: { ... }
```
**Diagnosis:** Server is returning items with invalid date objects.

#### ❌ **Problem: No Grouping**
```
[Timeline Debug] Rendering state: { allTimelineItemsCount: 5, groupedItemsSize: 0 }
```
**Diagnosis:** Grouping function is failing. Check date handling in `groupTimelineItemsByDay`.

#### ❌ **Problem: Auth/Baby ID Issue**
```
[Timeline Debug] Component render, babyId: undefined
```
**Diagnosis:** Component not receiving babyId prop. Check parent component.

### Step 4: Compare with Backend Diagnostics

The backend diagnostic script showed **5 items should be available**:
- 3 bottle/nursing activities
- 1 milestone
- 1 chat

Your console logs should show at least 5 items reaching the component. If not, check:

1. **Authentication**: Is the user authenticated? Check Network tab for 401/403 errors.
2. **Filters**: Are filters applied that exclude all items?
3. **Data serialization**: Are timestamps being serialized/deserialized correctly?
4. **Server Action**: Is the server action being called? Check Network tab.

## Next Steps Based on Logs

### If logs show data arriving but not rendering:
- Check React DevTools to see if component is re-rendering
- Check for CSS issues hiding the timeline
- Check if there are any React errors

### If logs show no data from server:
- Check browser Network tab for the server action request
- Verify auth context (userId, orgId)
- Run backend diagnostic scripts again

### If logs show data being filtered out:
- Check the filter values in logs
- Temporarily disable all filters to test
- Check if "skipped" filter is accidentally active

## Removing Debug Logging

Once the issue is resolved, you can remove the debug logs by searching for:
```
console.log('[Timeline Debug]
```

Or keep them but change to:
```typescript
if (process.env.NODE_ENV === 'development') {
  console.log('[Timeline Debug] ...');
}
```

## Summary

With this comprehensive logging, you can now:
1. ✅ See exactly what data the server returns
2. ✅ See how data is processed at each stage
3. ✅ See what gets filtered out and why
4. ✅ See how items are grouped by day
5. ✅ See the final rendering state

The backend diagnostics proved the data exists. These logs will show you where it's getting lost on the frontend!




