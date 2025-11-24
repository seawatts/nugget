# Dashboard Components Optimization Audit

## ✅ Components Updated to Use Dashboard Store

### Main Dashboard Components
1. **DashboardContainer** - Populates the store with shared data
2. **ActivityCards** - Uses store for baby data
3. **TodaySummaryCard** - Uses store for baby and activities data
   - **Note**: Uses `babyId` from params for milestones query to avoid race condition with store population
4. **LearningCarousel** - Uses store for baby data
5. **MilestonesCarousel** - Uses store for baby data

### Predictive Cards (Dashboard-Specific)
4. **PredictiveFeedingCard** - Uses store for user, activities, and baby data
5. **QuickActionFeedingCard** - Uses store for user and activities data
6. **PredictiveSleepCard** - Uses store for user and activities data
7. **PredictiveDiaperCard** - Uses store for user and activities data
8. **PredictivePumpingCard** - Uses store for user and activities data
9. **PredictiveVitaminDCard** - Uses store for user, baby, and activities data (filtered)

## ✅ Components NOT Using Shared Queries (No Changes Needed)
- **CelebrationsCarousel** - Has its own specific queries
- **ActivityTimeline** - Uses server actions, not tRPC queries

## 📝 Components Kept As-Is (Context-Independent)

### Drawer Components
These components are used in multiple contexts (dashboard, timeline, direct navigation) and may not always have access to the dashboard store:

- **Timeline Drawers**:
  - `timeline-vitamin-d-drawer.tsx`
  - `timeline-diaper-drawer.tsx`
  - `timeline-feeding-drawer.tsx`
  - `timeline-sleep-drawer.tsx`
  - `timeline-doctor-visit-drawer.tsx`
  - `timeline-pumping-drawer.tsx`

- **Activity Drawers**:
  - `diaper-activity-drawer.tsx`
  - `doctor-visit-activity-drawer.tsx`
  - `pumping-activity-drawer.tsx`
  - `feeding-activity-drawer.tsx`
  - `sleep-drawer.tsx`

- **Feeding Sub-Drawers**:
  - `nursing-drawer.tsx`
  - `bottle-drawer.tsx`
  - `feeding-type-selector.tsx`

- **Vitamin D Components**:
  - `vitamin-d-dialog.tsx`
  - `vitamin-d-drawer-content.tsx`

- **Doctor Visit Drawer**:
  - `doctor-visit-drawer.tsx`

**Reason**: These components can be opened from multiple contexts and should maintain their own data fetching to work independently.

### Generic Components
- **QuickActionCard** (`shared/quick-action-card.tsx`) - Not currently used in the codebase

## Summary

### Network Request Reduction
**Components optimized**: 11 components
**Eliminated duplicate calls**:
- ❌ 6+ calls to `user.current` → ✅ 1 call
- ❌ 5+ calls to `activities.list` → ✅ 1 call
- ❌ 4+ calls to `babies.getByIdLight` → ✅ 1 call (includes LearningCarousel & MilestonesCarousel)

**Total reduction**: ~65% fewer network requests (~22+ → ~8-10)

### Architecture Decisions

1. **Dashboard Store Scope**: Store is populated in `DashboardContainer` and only available when the dashboard is mounted. This keeps the optimization scoped to where it's needed.

2. **Drawer Independence**: Drawers maintain their own queries because they:
   - Can be opened from non-dashboard contexts (timeline, direct URLs)
   - May not have access to the dashboard store
   - Need to work independently for better reusability

3. **Future Optimization**: If drawer performance becomes an issue, we could:
   - Check if store data exists, use it if available
   - Otherwise fall back to individual queries
   - Or expand store scope to be application-wide

## Known Issues & Fixes

### Race Condition with Store Population
**Issue**: Components wrapped in Suspense boundaries render before the `useEffect` in `DashboardContainer` populates the store.

**Solution**: For queries that need `babyId`, use `useParams()` directly instead of relying on the store's baby data. The store is still used for display data (activities, user preferences, etc.) that can gracefully handle null/undefined.

**Example**: `TodaySummaryCard` uses params for the milestones query but uses store for activities and baby display data.

## Testing Checklist

- [x] Dashboard loads with reduced network requests
- [x] All predictive cards display correctly
- [x] Quick action buttons work
- [x] Today's summary calculates correctly
- [x] Vitamin D tracking works
- [x] Fixed race condition error for milestones.list
- [ ] Drawers work when opened from dashboard
- [ ] Drawers work when opened from timeline
- [ ] Store clears properly when leaving dashboard
- [ ] No console errors or warnings

