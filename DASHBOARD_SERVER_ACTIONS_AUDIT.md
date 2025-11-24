# Dashboard Server Actions Audit

## Problem Summary

Server actions are being used for READ operations on the dashboard, causing:
- ❌ No automatic caching
- ❌ No automatic deduplication
- ❌ Multiple identical network requests
- ❌ Poor performance

**Example:** `MilestoneCard` calls `getContextChatReplyAction` on every card mount. With 10 milestone cards = 10 duplicate network requests!

## Rule of Thumb

### Use tRPC Queries For:
- ✅ **READ operations** (fetching data)
- ✅ Data that's displayed to users
- ✅ Queries that might be called multiple times
- ✅ Data that should be cached
- ✅ Data shared across components

### Use Server Actions For:
- ✅ **WRITE operations** (mutations)
- ✅ Form submissions
- ✅ One-off actions that don't need caching
- ✅ Progressive enhancement scenarios

## Dashboard Components Using Server Actions

### 🔴 HIGH PRIORITY - Should Be tRPC Queries (READ Operations)

#### 1. **MilestoneCard** - `getContextChatReplyAction`
**Current:** Server action
**Issue:** Called on EVERY milestone card mount (10 cards = 10 requests!)
**Should Be:** tRPC query `chatReplies.getByContext({ babyId, contextId, contextType })`
**Benefits:**
- Automatic deduplication (10 cards calling same context = 1 request)
- Caching (no refetch on remount)
- Can invalidate when user submits an answer

**Files:**
- `apps/web-app/src/app/(app)/app/_components/milestones/milestone-card.tsx` (lines 130, 140)
- `apps/web-app/src/app/(app)/app/_components/learning/learning-card-info.tsx` (similar pattern)

---

#### 2. **ActivityTimeline** - `getActivitiesAction`
**Current:** Server action with manual pagination
**Issue:** No caching, manual state management
**Should Be:** tRPC `useInfiniteQuery` - `activities.getTimeline({ babyId, cursor, limit })`
**Benefits:**
- Built-in infinite query support
- Automatic caching
- Optimistic updates work better
- Query invalidation on mutations

**Files:**
- `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.tsx` (line 437)
- `apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.actions.ts`

---

#### 3. **LearningCarousel** - `getLearningCarouselContent`
**Current:** Server action called in useEffect
**Issue:** No caching, manual loading states
**Should Be:** tRPC query `learning.getCarouselContent({ babyId })`
**Benefits:**
- Automatic caching
- React Query handles loading states
- Can prefetch on server

**Files:**
- `apps/web-app/src/app/(app)/app/_components/learning/learning-carousel.tsx` (line 40)
- `apps/web-app/src/app/(app)/app/_components/learning/learning-carousel.actions.ts`

---

#### 4. **MilestonesCarousel** - `getMilestonesCarouselContent`
**Current:** Server action called in useEffect
**Issue:** No caching, manual loading states
**Should Be:** tRPC query `milestones.getCarouselContent({ babyId })`
**Benefits:**
- Automatic caching
- React Query handles loading states
- Can prefetch on server

**Files:**
- `apps/web-app/src/app/(app)/app/_components/milestones/milestones-carousel.tsx` (line 71)
- `apps/web-app/src/app/(app)/app/_components/milestones/milestones-carousel.actions.ts`

---

#### 5. **QuickActionCard** - `getActivityStatsAction`
**Current:** Server action
**Should Be:** tRPC query `activities.getStats({ babyId, activityType })`
**Benefits:**
- Caching across all quick action cards
- Invalidate when activities change

**Files:**
- `apps/web-app/src/app/(app)/app/_components/shared/quick-action-card.tsx` (line 52)

---

### ✅ OK To Keep As Server Actions (WRITE Operations)

These are mutations and should stay as server actions:

1. **Activity Mutations**
   - `createActivityAction` - creating activities
   - `updateActivityAction` - updating activities
   - `deleteActivityAction` - deleting activities
   - Skip actions (`skipSleepAction`, etc.)

2. **Milestone Mutations**
   - `saveMilestoneQuestionResponseAction` - saving answers
   - `markMilestoneCompleteAction` - marking complete

3. **Chat Mutations**
   - `sendChatMessageAction` - sending messages
   - Chat-related writes

4. **Other Mutations**
   - Celebration photos
   - User preferences updates
   - Any other WRITE operations

---

## Migration Strategy

### Phase 1: Critical Path (Eliminate Duplicate Requests)
1. ✅ Convert `getContextChatReplyAction` → tRPC query
   - Biggest impact: 10+ duplicate requests → 1 request
   - Makes milestone cards load instantly after first fetch

### Phase 2: Timeline Performance
2. ✅ Convert `getActivitiesAction` → tRPC infinite query
   - Better pagination handling
   - Automatic caching
   - Works better with optimistic updates

### Phase 3: Carousel Content
3. ✅ Convert carousel content actions → tRPC queries
   - `getLearningCarouselContent` → `learning.getCarouselContent`
   - `getMilestonesCarouselContent` → `milestones.getCarouselContent`
   - Enable server-side prefetching
   - Automatic caching

### Phase 4: Activity Stats
4. ✅ Convert `getActivityStatsAction` → tRPC query
   - Shared caching across quick action cards

---

## Expected Performance Impact

### Before (Current State)
- ~25+ network requests on dashboard load
- Duplicate requests for same data
- Manual loading states
- No caching between navigations

### After (With tRPC Queries)
- ~12-15 network requests on dashboard load (~50% reduction)
- Zero duplicate requests (automatic deduplication)
- Automatic loading states
- Instant loads on navigation (cached)
- **Combined with previous optimization: ~70% total reduction!**

---

## Implementation Notes

### tRPC Query Pattern

```typescript
// ❌ OLD - Server Action
const { execute } = useAction(getDataAction);
useEffect(() => {
  execute({ babyId });
}, [babyId]);

// ✅ NEW - tRPC Query
const { data, isLoading } = api.data.get.useQuery({ babyId });
// That's it! React Query handles everything
```

### With Caching

```typescript
// Automatic caching - same query = instant result
const { data } = api.chatReplies.getByContext.useQuery({
  babyId,
  contextId: `${type}-${title}`,
  contextType: 'milestone'
});
// If another component calls this with same params = instant from cache!
```

### Invalidation Pattern

```typescript
// After mutation, invalidate related queries
const utils = api.useUtils();
await saveMilestoneAnswer(answer);
await utils.chatReplies.getByContext.invalidate(); // Refetches repliers
```

---

## Next Steps

1. Create tRPC routers for:
   - `chatReplies` - for replier data
   - `timeline` - for activity timeline
   - `learning` - for learning carousel
   - `milestones` - for milestone carousel (if not exists)

2. Migrate components one by one (start with MilestoneCard for biggest impact)

3. Remove old server action files after migration

4. Update prefetching in `page.tsx` to include new queries


