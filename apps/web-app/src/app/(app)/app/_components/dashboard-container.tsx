'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { useParams } from 'next/navigation';
import { useCallback, useState } from 'react';
import { ActivityCards } from '~/app/(app)/app/_components/activity-cards';
import { ActivityTimeline } from '~/app/(app)/app/_components/activity-timeline';
import { CelebrationsCarousel } from '~/app/(app)/app/_components/celebrations-carousel';
import { LearningCarousel } from '~/app/(app)/app/_components/learning-carousel';
import { MilestonesCarousel } from '~/app/(app)/app/_components/milestones-carousel';
import { TodaySummaryCard } from '~/app/(app)/app/_components/today-summary-card';

export function DashboardContainer() {
  const params = useParams();
  const babyId = params.userId as string;
  const { data: baby } = api.babies.getById.useQuery({ id: babyId });
  const { data: user } = api.user.current.useQuery();
  const [optimisticActivities, setOptimisticActivities] = useState<
    Array<typeof Activities.$inferSelect>
  >([]);
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

  return (
    <main className="px-4 pt-4 pb-8 min-h-screen">
      {/* Celebration Card - Shows on milestone days */}
      <CelebrationsCarousel babyId={babyId} />

      {/* Today's Summary */}
      <div className="mb-6">
        <TodaySummaryCard
          babyBirthDate={baby?.birthDate}
          babyName={baby?.firstName}
          babyPhotoUrl={baby?.photoUrl}
          measurementUnit={user?.measurementUnit || 'metric'}
          optimisticActivities={optimisticActivities}
        />
      </div>

      {/* Predictive Action Cards (includes Feeding, Sleep, Diaper predictions) + Quick Actions */}
      <div className="mb-6">
        <ActivityCards
          onActivityCreated={handleActivityCreated}
          onActivityUpdated={handleActivityUpdated}
          onOptimisticActivity={handleOptimisticActivity}
          refreshTrigger={refreshTrigger}
        />
      </div>

      {/* Learning Carousel - Educational content based on baby's age */}
      <LearningCarousel babyId={babyId} />

      {/* Milestones Carousel - Track baby's developmental milestones */}
      <MilestonesCarousel babyId={babyId} />

      {/* Timeline */}
      <ActivityTimeline
        optimisticActivities={optimisticActivities}
        refreshTrigger={refreshTrigger}
      />
    </main>
  );
}
