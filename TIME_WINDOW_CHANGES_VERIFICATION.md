# Baby Dashboard Time Window Changes - Verification

## Summary of Changes

Updated baby dashboard statistics to use appropriate time windows:
- **Feeding**: Rolling 24-hour window
- **Diaper**: Rolling 24-hour window
- **Sleep**: Sessions ending today (including in-progress)

## Files Modified

1. `apps/web-app/src/app/(app)/app/_components/activities/feeding/feeding-goals.ts`
2. `apps/web-app/src/app/(app)/app/_components/activities/diaper/diaper-goals.ts`
3. `apps/web-app/src/app/(app)/app/_components/activities/sleep/sleep-goals.ts`

## Edge Case Verification

### Test Case 1: Rolling 24-hour for Feeding (11 PM yesterday)
**Scenario**: Baby had a feeding at 11 PM yesterday (23 hours ago)

**Expected**: ✅ Should be counted in today's stats

**Logic**:
```typescript
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
// Activity at 11 PM yesterday is >= twentyFourHoursAgo (24 hours ago)
// Result: INCLUDED ✅
```

### Test Case 2: Rolling 24-hour for Diaper (25 hours ago)
**Scenario**: Diaper change happened 25 hours ago

**Expected**: ❌ Should NOT be counted in today's stats

**Logic**:
```typescript
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
// Activity 25 hours ago is < twentyFourHoursAgo
// Result: EXCLUDED ✅
```

### Test Case 3: Sleep crossing midnight (11 PM → 4 AM)
**Scenario**: Baby slept from 11 PM yesterday to 4 AM today (5 hours total)

**Expected**: ✅ Full 5-hour duration should count toward today

**Logic**:
```typescript
const today = startOfDay(new Date()); // Midnight today
const startTime = new Date('2024-01-01T23:00:00'); // 11 PM yesterday
const duration = 300; // 5 hours in minutes
const endTime = new Date(startTime.getTime() + duration * 60 * 1000); // 4 AM today

// Check: endTime >= today
// 4 AM today >= midnight today = TRUE
// Result: INCLUDED with full 5-hour duration ✅
```

### Test Case 4: Sleep from day before yesterday
**Scenario**: Baby slept from 10 PM day-before-yesterday to 2 AM yesterday

**Expected**: ❌ Should NOT count toward today

**Logic**:
```typescript
const today = startOfDay(new Date()); // Midnight today
const startTime = new Date('2024-01-01T22:00:00'); // 10 PM day-before
const duration = 240; // 4 hours
const endTime = new Date(startTime.getTime() + duration * 60 * 1000); // 2 AM yesterday

// Check: endTime >= today
// 2 AM yesterday >= midnight today = FALSE
// Result: EXCLUDED ✅
```

### Test Case 5: In-progress sleep
**Scenario**: Baby started sleeping 2 hours ago, still sleeping now

**Expected**: ✅ Should be counted with 120 minutes elapsed time

**Logic**:
```typescript
const startTime = new Date(Date.now() - 2 * 60 * 60 * 1000); // 2 hours ago
const duration = null; // In progress

// Check: startTime < new Date()
// 2 hours ago < now = TRUE

// Calculate elapsed time:
const elapsed = Math.floor((Date.now() - startTime.getTime()) / (1000 * 60));
// elapsed = ~120 minutes

// Result: INCLUDED with 120 minutes duration ✅
```

### Test Case 6: Multiple feedings in rolling window
**Scenario**:
- Feeding at 11 PM yesterday (100 ml)
- Feeding at 8 AM today (120 ml)
- Feeding at 2 PM today (110 ml)

**Expected**: All 3 counted, total 330 ml

**Logic**:
```typescript
const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

// Feeding 1: 11 PM yesterday (23 hours ago) >= twentyFourHoursAgo ✅
// Feeding 2: 8 AM today (assuming now is 3 PM) >= twentyFourHoursAgo ✅
// Feeding 3: 2 PM today >= twentyFourHoursAgo ✅

// count = 3
// totalMl = 330
// avgAmountMl = 110
```

## TypeScript Compilation

✅ All changes passed TypeScript compilation successfully
✅ No linter errors detected
✅ Type signatures remain unchanged (backward compatible)

## Impact Analysis

### Components Using These Functions:
1. `predictive-feeding-card.tsx` - Shows feeding stats with rolling 24-hour window
2. `predictive-diaper-card.tsx` - Shows diaper stats with rolling 24-hour window
3. `predictive-sleep-card.tsx` - Shows sleep stats for sessions ending today

### User-Facing Changes:
- **Feeding/Diaper cards**: Now show stats from last 24 hours instead of since midnight
  - More accurate representation of baby's actual patterns
  - Better handles midnight crossover scenarios

- **Sleep card**: Now includes overnight sleep that started yesterday
  - If baby slept 11 PM - 4 AM, the full 5 hours counts toward today
  - In-progress sleep shows elapsed time in real-time

## Testing Recommendations

For manual testing, verify:
1. Create a feeding at 11 PM, check if it appears in stats next day before 11 PM
2. Start a sleep session, verify it shows in stats with elapsed time
3. Complete an overnight sleep (e.g., 11 PM - 4 AM), verify full duration counts
4. Wait 25 hours after an activity, verify it disappears from rolling window stats

## Conclusion

✅ All changes implemented successfully
✅ Edge cases handled correctly
✅ TypeScript compilation passes
✅ No breaking changes to API

