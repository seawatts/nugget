# Skip Implementation Status

## ✅ COMPLETED
1. **Schema Changes** - Added `skipped` and `skipReason` fields to all detail schemas
   - ✅ diaperDetailsSchema  
   - ✅ nursingDetailsSchema (feeding)
   - ✅ pumpingDetailsSchema
   - ✅ sleepDetailsSchema

2. **Diaper Card** - Fully implemented with DB persistence
   - ✅ skipDiaperAction created
   - ✅ DiaperPrediction interface updated (added recentSkipTime)
   - ✅ predictNextDiaper logic updated (finds skip activities)
   - ✅ predictive-diaper-card.tsx updated (uses DB skip data)

3. **Feeding Actions**
   - ✅ skipFeedingAction created

## ⏳ TODO - Apply Same Pattern

### Feeding Card (needs prediction + card update)
- [ ] Update FeedingPrediction interface (add recentSkipTime)
- [ ] Update predictNextFeeding logic (find skip activities)  
- [ ] Update predictive-feeding-card.tsx (use prediction.recentSkipTime instead of localStorage)

### Pumping Card (needs action + prediction + card)
- [ ] Add skipPumpingAction  
- [ ] Update PumpingPrediction interface (add recentSkipTime)
- [ ] Update predictNextPumping logic (find skip activities)
- [ ] Update predictive-pumping-card.tsx (use DB skip data)

### Sleep Card (needs action + prediction + card)
- [ ] Add skipSleepAction
- [ ] Update SleepPrediction interface (add recentSkipTime)
- [ ] Update predictNextSleep logic (find skip activities)
- [ ] Update predictive-sleep-card.tsx (use DB skip data)

## Pattern to Apply

For each remaining card:

1. **Add Skip Action** (if not done)
```typescript
export const skip[Type]Action = action.action(
  async (): Promise<{ activity: typeof Activities.$inferSelect }> => {
    // ... auth and baby checks ...
    const activity = await api.activities.create({
      babyId: baby.id,
      details: {
        type: '[type]',
        // ... type-specific required fields ...
        skipped: true,
        skipReason: 'user_dismissed',
      },
      isScheduled: false,
      startTime: new Date(),
      type: '[type]',
    });
    revalidatePath('/app');
    return { activity };
  },
);
```

2. **Update Prediction Interface**
```typescript
export interface [Type]Prediction {
  // ... existing fields
  recentSkipTime: Date | null;
}
```

3. **Update Prediction Logic**
```typescript
const skipActivities = activities.filter(
  (a) => a.details?.skipped === true
);
const recentSkipTime = skipActivities[0]
  ? new Date(skipActivities[0].startTime)
  : null;

// Add to all return statements:
return {
  // ... other fields
  recentSkipTime,
};
```

4. **Update Card Component**
```typescript
// Remove localStorage, use prediction data
const isRecentlySkipped = prediction.recentSkipTime
  ? Date.now() - new Date(prediction.recentSkipTime).getTime() <
    prediction.intervalHours * 60 * 60 * 1000
  : false;

const displayNextTime =
  isRecentlySkipped && prediction.recentSkipTime
    ? new Date(
        new Date(prediction.recentSkipTime).getTime() +
          prediction.intervalHours * 60 * 60 * 1000,
      )
    : prediction.nextTime;

// Update handleSkip
const handleSkip = async (e: React.MouseEvent) => {
  e.stopPropagation();
  setSkipping(true);
  try {
    await skip[Type]Action();
    toast.success('[Type] reminder skipped');
    await loadData();
  } finally {
    setSkipping(false);
  }
};
```
