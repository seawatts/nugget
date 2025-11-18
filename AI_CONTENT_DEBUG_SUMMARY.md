# AI Content Generation Debug Summary

## Current Architecture

### Learning Content
1. `getLearningCarouselContent` creates rules for postpartum days 0-112 and weeks 17-52
2. Each rule uses `aiTextBaml` which wraps a call to `generateDailyLearning` orchestrator
3. The AI content is cached with a 1-day TTL using `DbCache`
4. Props are marked as `[AI_PENDING]` initially and resolved progressively

### Milestones Content
1. `getMilestonesCarouselContent` directly calls `generateMilestoneSuggestions` orchestrator
2. The AI call happens synchronously during the server action
3. Results are mapped to `MilestoneCardData` with `[AI_PENDING]` placeholders for enhancements

## Identified Issues

### 1. Synchronous AI Generation Blocks Page Load
**Problem**: The AI orchestrators (`generateDailyLearning`, `generateMilestoneSuggestions`) are called synchronously during the server action, blocking the entire request until complete.

**Impact**:
- First-time page loads take 10-30+ seconds while AI generates content
- Users see a blank page or loading spinner for extended periods
- No content is shown until AI completes

**Evidence**:
- Added timing logs to measure AI call duration
- Frontend shows loading state while `isLoading || isResolvingAI`

### 2. Progressive Resolution Not Working as Intended
**Problem**: The `[AI_PENDING]` markers are returned immediately, but the frontend calls `resolveCardAIContent` which still blocks on AI generation.

**Impact**:
- Even with "progressive" loading, cards don't appear until ALL AI content is resolved
- The `isResolvingAI` state keeps the loading spinner showing

**Code Location**:
- `learning-carousel.tsx` lines 48-143
- `resolveCardAIContent` in `learning-carousel.actions.ts`

### 3. Cache Pending State Creates Long Waits
**Problem**: When AI is generating, a "pending" marker is cached for 5 minutes. Subsequent requests see `[AI_PENDING]` but have no way to know when generation is actually complete.

**Impact**:
- User refreshes page and still sees loading state
- No polling or websocket mechanism to check if generation is done
- After 5 minutes, the pending marker expires and it tries again

**Code Location**:
- `dynamic-baml.ts` lines 70-93
- `PENDING_TTL_MS = 5 * 60 * 1000` (5 minutes)

### 4. No Fallback Content
**Problem**: If AI generation fails or takes too long, no fallback content is shown. The component returns `null` when `cards.length === 0`.

**Impact**:
- Users see nothing if AI fails
- No graceful degradation

## Recommendations

### Immediate Fixes (High Priority)

#### 1. Show Skeleton/Loading States with Cards
Instead of blocking on AI content, show card skeletons immediately:

```typescript
// In learning-carousel.tsx
if (cards.length === 0 && isLoading) {
  // Show 3-5 skeleton cards
  return (
    <div className="mb-6">
      <H2>Learning</H2>
      {[...Array(3)].map((_, i) => (
        <LearningCardSkeleton key={i} />
      ))}
    </div>
  );
}
```

#### 2. Make AI Resolution Non-Blocking
Change the AI resolution to be truly asynchronous:

```typescript
// Don't wait for AI in resolveCardAIContent
// Instead, check cache and return immediately
// If pending, return [AI_PENDING] marker
// Frontend polls every 2-3 seconds to check status
```

#### 3. Add Polling Mechanism
```typescript
// In learning-carousel.tsx
useEffect(() => {
  const interval = setInterval(async () => {
    // Check if any cards still have [AI_PENDING]
    const hasPending = cards.some(card =>
      Object.values(card.props).includes('[AI_PENDING]')
    );

    if (hasPending) {
      // Try to resolve again
      const updated = await resolveCardAIContent(...);
      if (updated) {
        updateCard(updated);
      }
    }
  }, 3000); // Poll every 3 seconds

  return () => clearInterval(interval);
}, [cards]);
```

### Medium-Term Improvements

#### 1. Background Job Queue
Move AI generation to a background job system:
- When content is requested and not cached, enqueue a job
- Return `[AI_PENDING]` immediately
- Frontend polls for completion
- Job completes and updates cache
- Next poll returns actual content

#### 2. Server-Sent Events (SSE)
Use SSE to push updates when AI content is ready:
- Client subscribes to content updates for their baby
- Server pushes events when cache is updated
- No polling needed

#### 3. Reduce AI Call Latency
- Use streaming responses from BAML where possible
- Show partial results as they arrive
- Cache more aggressively (longer TTL for stable content)

### Long-Term Improvements

#### 1. Pre-generate Content
For common scenarios (days 0-30), pre-generate content:
- Run daily job to generate content for active users
- Cache is always warm for new users
- Only edge cases trigger on-demand generation

#### 2. Progressive Enhancement
- Show basic, static content immediately
- Enhance with AI-generated details progressively
- User sees something useful right away

## Debug Logging Added

I've added comprehensive logging to help diagnose the issue:

### Learning Carousel
- Rule count generated
- Context values (scope, ppDay, ppWeek, babyAge)
- Result of `pickForSlot` for each slot attempt

### Milestones Carousel
- Context values (ageInDays, ageInWeeks, babyName)
- AI call start/end timing
- Result count from AI

### How to View Logs
1. Open browser DevTools console (for client logs)
2. Check server logs/terminal (for server-side action logs)
3. Look for `[Learning]` and `[Milestones]` prefixes

## Next Steps

1. **Run the app** and check logs to confirm:
   - Are rules being generated?
   - Are rules matching?
   - How long do AI calls take?
   - Are results being returned?

2. **Implement quick fix**: Show skeleton cards while AI generates

3. **Implement polling**: Check back every few seconds for AI completion

4. **Long-term**: Move to background jobs or SSE for better UX

