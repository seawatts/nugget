<!-- d0dfdf2c-aa15-4062-ab5d-7b015f4a7244 8eab3f16-11e4-42df-8fca-c32d239ec800 -->
# Add Critical Stats to Activity Drawers

## Overview

Enhance all activity stats drawers with missing metrics that help parents make critical health decisions and identify potential issues. Focus on both health indicators and behavior change metrics.

## Implementation Todos

### Phase 1: Daily Averages Enhancement (HIGH PRIORITY)

1. **Add per-day sub-text to Feedings Count card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/feeding/components/feeding-stats-drawer.tsx`
- Calculate per-day value using `calculateFeedingStatForCard('count', statCardsTimePeriod)` with `pivotPeriod: 'per_day'`
- Add sub-text: "Avg: X/day" below main count value
- Only show when time period spans multiple days

2. **Add per-day sub-text to Sleep Sessions card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/sleep/components/sleep-stats-drawer.tsx`
- Calculate per-day value using `calculateSleepStatForCard('count', statCardsTimePeriod)` with `pivotPeriod: 'per_day'`
- Add sub-text: "Avg: X/day" below main count value

3. **Add per-day sub-text to Total Sleep card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/sleep/components/sleep-stats-drawer.tsx`
- Calculate per-day value using `calculateSleepStatForCard('total', statCardsTimePeriod)` with `pivotPeriod: 'per_day'`
- Add sub-text: "Avg: Xh/day" below main total value

4. **Add per-day sub-text to Diapers Count card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/diaper/components/diaper-stats-drawer.tsx`
- Calculate per-day value using `calculateDiaperStatForCard('count', statCardsTimePeriod)` with `pivotPeriod: 'per_day'`
- Add sub-text: "Avg: X/day" below main count value

### Phase 2: Shortest Intervals (Health Warning Indicators)

5. **Add calculateShortestFeedingGap function**

- File: `apps/web-app/src/app/(app)/app/_components/activities/feeding/feeding-stat-calculations.ts`
- Similar to `calculateLongestFeedingGap` but find minimum gap
- Return formatted value with hours/minutes

6. **Add "Min:" sub-text to Feeding Longest Gap card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/feeding/components/feeding-stats-drawer.tsx`
- Display shortest gap as sub-text below longest gap

7. **Add calculateShortestSleep function**

- File: `apps/web-app/src/app/(app)/app/_components/activities/sleep/sleep-stat-calculations.ts`
- Find minimum sleep duration from all sleep sessions
- Return formatted value with hours/minutes

8. **Add "Min:" sub-text to Longest Sleep card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/sleep/components/sleep-stats-drawer.tsx`
- Display shortest sleep as sub-text below longest sleep

9. **Add calculateShortestAwake function**

- File: `apps/web-app/src/app/(app)/app/_components/activities/sleep/sleep-stat-calculations.ts`
- Find minimum awake period between sleep sessions
- Return formatted value with hours/minutes

10. **Add "Min:" sub-text to Longest Awake card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/sleep/components/sleep-stats-drawer.tsx`
- Display shortest awake period as sub-text below longest awake

11. **Add calculateShortestDiaperGap function**

- File: `apps/web-app/src/app/(app)/app/_components/activities/diaper/diaper-stat-calculations.ts`
- Similar to `calculateLongestDiaperGap` but find minimum gap
- Return formatted value with hours/minutes

12. **Add "Min:" sub-text to Diaper Longest Gap card**

- File: `apps/web-app/src/app/(app)/app/_components/activities/diaper/components/diaper-stats-drawer.tsx`
- Display shortest gap as sub-text below longest gap

## Key Implementation Notes

- Use existing `normalizeValueByPivot` function with `pivotPeriod: 'per_day'` for daily averages
- Follow existing sub-text pattern: `text-sm text-muted-foreground` styling
- Only show per-day values when time period spans multiple days
- Format minutes as whole numbers (already handled by existing formatting functions)
- Use `useMemo` for calculations to optimize performance

### To-dos

- [ ] Add scrollable mode to ActivityTimeline component with horizontal scroll container and snap points
- [ ] Enable scrollable mode in SleepTimeline component
- [ ] Remove overflow-x-hidden from drawer content container to allow horizontal scrolling
- [ ] Add scrollable mode to ActivityTimeline component with horizontal scroll container and snap points
- [ ] Enable scrollable mode in SleepTimeline component
- [ ] Remove overflow-x-hidden from drawer content container to allow horizontal scrolling