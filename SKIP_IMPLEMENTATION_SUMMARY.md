# Skip Button Implementation - DB Persistence

## Summary
Converted skip functionality from localStorage to database persistence using activities with `skipped: true` flag.

## Benefits
- ✅ Cross-device sync
- ✅ Survives page refresh
- ✅ Prediction logic can use skip data
- ✅ Audit trail of skips
- ✅ No localStorage limitations

## Implementation Pattern

### 1. Add Skip Action (actions.ts)
```typescript
export const skip[Type]Action = action.action(
  async (): Promise<{ activity: typeof Activities.$inferSelect }> => {
    // Auth check...
    // Get baby...
    
    const activity = await api.activities.create({
      babyId: baby.id,
      details: {
        skipped: true,
        skipReason: 'user_dismissed',
      },
      isScheduled: false,
      startTime: new Date(),
      type: '[type]', // diaper, feeding, pumping, sleep
    });
    
    revalidatePath('/app');
    return { activity };
  },
);
```

### 2. Update Prediction Interface (prediction.ts)
```typescript
export interface [Type]Prediction {
  // ... existing fields
  recentSkipTime: Date | null; // Add this
}
```

### 3. Update Prediction Logic (prediction.ts)
```typescript
// In predict function, check for skip activities
const skipActivities = activities.filter(
  (a) => a.details?.skipped === true
);
const recentSkipTime = skipActivities[0] 
  ? new Date(skipActivities[0].startTime) 
  : null;

// Add recentSkipTime to all return statements
return {
  // ... other fields
  recentSkipTime,
};
```

### 4. Update Card Component
```typescript
// Remove localStorage logic
// Use prediction.recentSkipTime instead
const isRecentlySkipped = prediction.recentSkipTime
  ? Date.now() - new Date(prediction.recentSkipTime).getTime() < prediction.intervalHours * 60 * 60 * 1000
  : false;

// Update handleSkip to call skip action
const handleSkip = async (e: React.MouseEvent) => {
  e.stopPropagation();
  setSkipping(true);
  try {
    await skip[Type]Action();
    toast.success('[Type] reminder skipped');
    await loadData(); // Reload with updated skip info
  } finally {
    setSkipping(false);
  }
};
```

## Completed
- ✅ Diaper card

## TODO
- ⏳ Feeding card
- ⏳ Pumping card
- ⏳ Sleep card
