'use client';

import type { Activities } from '@nugget/db/schema';
import { useCallback, useEffect, useState } from 'react';
import { ActivityCards } from '~/app/(app)/app/_components/activity-cards';
import { ActivityTimeline } from '~/app/(app)/app/_components/activity-timeline';
import { TodaySummaryCard } from '~/app/(app)/app/_components/today-summary-card';

export function DashboardContainer() {
  const [optimisticActivities, setOptimisticActivities] = useState<
    Array<typeof Activities.$inferSelect>
  >([]);
  const [isScrolled, setIsScrolled] = useState(false);
  const [refreshTrigger, setRefreshTrigger] = useState(0);

  const handleOptimisticActivity = useCallback(
    (activity: typeof Activities.$inferSelect) => {
      setOptimisticActivities((prev) => {
        // Check if this activity already exists (update case)
        const existingIndex = prev.findIndex((a) => a.id === activity.id);
        if (existingIndex !== -1) {
          // Update existing activity
          const updated = [...prev];
          updated[existingIndex] = activity;
          return updated;
        }
        // Add new activity
        return [...prev, activity];
      });
    },
    [],
  );

  const handleActivityCreated = useCallback(() => {
    // Trigger refresh and clear optimistic activities after a short delay
    setTimeout(() => {
      setOptimisticActivities([]);
      setRefreshTrigger((prev) => prev + 1);
    }, 1000);
  }, []);

  const handleActivityUpdated = useCallback(() => {
    // Trigger refresh immediately after update completes
    setRefreshTrigger((prev) => prev + 1);
    // Clear optimistic activities after a longer delay to allow refetch to complete
    setTimeout(() => {
      setOptimisticActivities([]);
    }, 2000);
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      // Show compact header when scrolled down more than 100px
      setIsScrolled(window.scrollY > 100);
    };

    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <>
      {/* Compact sticky header - shows when scrolled */}
      {isScrolled && (
        <div className="fixed top-0 left-0 right-0 z-30 bg-background/98 backdrop-blur-xl border-b border-border shadow-lg px-4 py-3 animate-in slide-in-from-top duration-200">
          <ActivityCards
            compact
            onActivityCreated={handleActivityCreated}
            onActivityUpdated={handleActivityUpdated}
            onOptimisticActivity={handleOptimisticActivity}
          />
        </div>
      )}

      <main className="px-4 pt-4 pb-8 min-h-screen">
        {/* Full-size quick actions */}
        <div className="mb-6">
          <ActivityCards
            onActivityCreated={handleActivityCreated}
            onActivityUpdated={handleActivityUpdated}
            onOptimisticActivity={handleOptimisticActivity}
          />
        </div>

        {/* Today's Summary */}
        <div className="mb-6">
          <TodaySummaryCard
            optimisticActivities={optimisticActivities}
            refreshTrigger={refreshTrigger}
          />
        </div>

        {/* Timeline */}
        <ActivityTimeline
          optimisticActivities={optimisticActivities}
          refreshTrigger={refreshTrigger}
        />
      </main>
    </>
  );
}
