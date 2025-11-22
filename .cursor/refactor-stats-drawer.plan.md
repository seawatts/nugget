# Refactor Predictive Stats Drawer - Split into Activity-Specific Components

## Goal
Refactor the monolithic `predictive-stats-drawer.tsx` file into smaller, co-located, activity-specific components while extracting shared functionality into reusable utilities.

## Current Structure
- Single file: `apps/web-app/src/app/(app)/app/_components/activities/shared/components/predictive-cards/predictive-stats-drawer.tsx` (~850 lines)
- Contains: All trend charts, comparison logic, drawer rendering for all activity types

## Target Structure

### Shared Components (stay in shared folder)
```
shared/components/
├── stats/
│   ├── comparison-chart.tsx          # ComparisonChart component
│   ├── stats-drawer-wrapper.tsx      # Base drawer UI wrapper
│   ├── metric-controls.tsx            # Count/Amount toggle + Total/Avg dropdown
│   └── index.ts                       # Exports
└── types/
    └── stats.ts                       # Shared type definitions
```

### Activity-Specific Components (in respective activity folders)
```
feeding/
├── components/
│   ├── feeding-stats-drawer.tsx       # Feeding-specific drawer
│   ├── feeding-trend-chart.tsx        # Feeding trend chart
│   ├── vitamin-d-tracker.tsx          # Vitamin D tracker
│   └── index.ts

sleep/
├── components/
│   ├── sleep-stats-drawer.tsx
│   ├── sleep-trend-chart.tsx
│   └── index.ts

pumping/
├── components/
│   ├── pumping-stats-drawer.tsx
│   ├── pumping-trend-chart.tsx
│   └── index.ts

diaper/
├── components/
│   ├── diaper-stats-drawer.tsx
│   ├── diaper-trend-chart.tsx
│   └── index.ts
```

## Refactoring Steps

### Phase 1: Create Shared Infrastructure

#### 1.1 Extract Shared Types
- Create `shared/types/stats.ts`
- Move interfaces: `StatsComparison`, `SleepStatsComparison`, `DiaperStatsComparison`, `TrendData`, `ComparisonData`, `VitaminDDay`
- Export all types from index

#### 1.2 Create ComparisonChart Component
- Create `shared/components/stats/comparison-chart.tsx`
- Move `ComparisonChart` function
- Add proper TypeScript interfaces
- Export from `shared/components/stats/index.ts`

#### 1.3 Create MetricControls Component
- Create `shared/components/stats/metric-controls.tsx`
- Extract the Count/Amount toggle buttons + Total/Avg dropdown logic
- Make it generic and reusable for feeding/pumping/sleep
- Props: `metricType`, `setMetricType`, `amountType`, `setAmountType`, `activityType`, `labels`

#### 1.4 Create StatsDrawerWrapper Component
- Create `shared/components/stats/stats-drawer-wrapper.tsx`
- Extract the base Drawer UI structure (DrawerHeader, DrawerTitle, etc.)
- Props: `open`, `onOpenChange`, `title`, `children`

#### 1.5 Create Shared Chart Utilities
- Create `shared/components/stats/chart-utils.ts`
- Extract date formatting logic: `formatChartDate(date: Date) => string`
- Extract title/description generation functions
- Export common chart configurations

### Phase 2: Extract Feeding Components

#### 2.1 Create FeedingTrendChart
- Create `feeding/components/feeding-trend-chart.tsx`
- Move `FeedingTrendChart` function
- Import shared types and utilities
- Export from `feeding/components/index.ts`

#### 2.2 Create VitaminDTracker
- Create `feeding/components/vitamin-d-tracker.tsx`
- Move `VitaminDTracker` function
- Move `VitaminDDay` type to component file (feeding-specific)
- Export from `feeding/components/index.ts`

#### 2.3 Create FeedingStatsDrawer
- Create `feeding/components/feeding-stats-drawer.tsx`
- Use `StatsDrawerWrapper` for base structure
- Use `MetricControls` for interactive controls
- Use `ComparisonChart` for comparison section
- Render `FeedingTrendChart` and `VitaminDTracker`
- Props: `open`, `onOpenChange`, `trendData`, `statsComparison`, `unit`, `vitaminDData`

#### 2.4 Update Feeding Prediction Card
- Update `predictive-feeding-card.tsx` imports
- Replace `PredictiveStatsDrawer` with `FeedingStatsDrawer`
- Verify all functionality works

### Phase 3: Extract Sleep Components

#### 3.1 Create SleepTrendChart
- Create `sleep/components/sleep-trend-chart.tsx`
- Move `SleepTrendChart` function
- Import shared types and utilities
- Export from `sleep/components/index.ts`

#### 3.2 Create SleepStatsDrawer
- Create `sleep/components/sleep-stats-drawer.tsx`
- Use shared components (`StatsDrawerWrapper`, `MetricControls`, `ComparisonChart`)
- Render `SleepTrendChart`
- Props: `open`, `onOpenChange`, `trendData`, `statsComparison`

#### 3.3 Update Sleep Prediction Card
- Update `predictive-sleep-card.tsx` imports
- Replace `PredictiveStatsDrawer` with `SleepStatsDrawer`
- Verify functionality

### Phase 4: Extract Pumping Components

#### 4.1 Create PumpingTrendChart
- Create `pumping/components/pumping-trend-chart.tsx`
- Move `PumpingTrendChart` function
- Import shared types and utilities
- Export from `pumping/components/index.ts`

#### 4.2 Create PumpingStatsDrawer
- Create `pumping/components/pumping-stats-drawer.tsx`
- Use shared components
- Render `PumpingTrendChart`
- Props: `open`, `onOpenChange`, `trendData`, `statsComparison`, `unit`

#### 4.3 Update Pumping Prediction Card
- Update `predictive-pumping-card.tsx` imports
- Replace `PredictiveStatsDrawer` with `PumpingStatsDrawer`
- Verify functionality

### Phase 5: Extract Diaper Components

#### 5.1 Create DiaperTrendChart
- Create `diaper/components/diaper-trend-chart.tsx`
- Move `DiaperTrendChart` function
- Import shared types and utilities
- Export from `diaper/components/index.ts`

#### 5.2 Create DiaperStatsDrawer
- Create `diaper/components/diaper-stats-drawer.tsx`
- Use shared components
- Render `DiaperTrendChart`
- Props: `open`, `onOpenChange`, `trendData`, `statsComparison`

#### 5.3 Update Diaper Prediction Card
- Update `predictive-diaper-card.tsx` imports
- Replace `PredictiveStatsDrawer` with `DiaperStatsDrawer`
- Verify functionality

### Phase 6: Cleanup and Verification

#### 6.1 Remove Original File
- Delete `predictive-stats-drawer.tsx` from shared folder
- Update `shared/components/predictive-cards/index.ts` to remove export

#### 6.2 Verify All Imports
- Check all prediction cards import the correct drawer component
- Ensure no broken imports exist

#### 6.3 Test Each Activity
- Test feeding drawer with all controls (Count/Amount, Total/Avg, Vitamin D)
- Test sleep drawer with all controls (Naps/Hours, Total/Avg)
- Test pumping drawer with all controls (Count/Amount, Total/Avg)
- Test diaper drawer (no controls, just chart)

#### 6.4 Code Quality Check
- Run linter on all new files
- Ensure TypeScript has no errors
- Check for any code duplication that can be further reduced

## Benefits of This Refactoring

1. **Better Code Organization**: Each activity's stats drawer is co-located with related components
2. **Improved Maintainability**: Smaller, focused files are easier to understand and modify
3. **Reusability**: Shared components (ComparisonChart, MetricControls) can be reused
4. **Type Safety**: Clearer type definitions for each activity's specific needs
5. **Performance**: Potential for better code-splitting (though minimal impact)
6. **Developer Experience**: Easier to find and modify activity-specific logic

## Notes

- Keep the same prop interfaces where possible to minimize changes to parent components
- Ensure all chart configurations, colors, and behaviors remain identical
- Test thoroughly after each phase to catch issues early
- Consider adding Storybook stories for the new shared components

