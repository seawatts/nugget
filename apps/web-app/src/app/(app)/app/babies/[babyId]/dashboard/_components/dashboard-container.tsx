'use client';

import { api } from '@nugget/api/react';
import { useParams } from 'next/navigation';
import { Suspense } from 'react';
import { ActivityCards } from '~/app/(app)/app/_components/activities/activity-cards';
import { ActivityTimeline } from '~/app/(app)/app/_components/activities/timeline/activity-timeline';
import { CelebrationsCarousel } from '~/app/(app)/app/_components/celebrations/celebrations-carousel';
import { LearningCarousel } from '~/app/(app)/app/_components/learning/learning-carousel';
import { MilestonesCarousel } from '~/app/(app)/app/_components/milestones/milestones-carousel';
import {
  ActivityCardsSkeleton,
  ActivityTimelineSkeleton,
  CelebrationsSkeleton,
  LearningCarouselSkeleton,
  MilestonesCarouselSkeleton,
  TodaySummarySkeleton,
} from '~/app/(app)/app/_components/skeletons';
import { TodaySummaryCard } from '~/app/(app)/app/_components/today-summary-card';

export function DashboardContainer() {
  const params = useParams();
  const babyId = params.babyId as string;

  // Use suspense queries to leverage prefetched data (lightweight version without nested relations)
  const [baby] = api.babies.getByIdLight.useSuspenseQuery({ id: babyId });
  const [user] = api.user.current.useSuspenseQuery();

  return (
    <main className="px-4 pt-4 pb-8 min-h-screen">
      {/* Celebration Card - Shows on milestone days */}
      <Suspense fallback={<CelebrationsSkeleton />}>
        <CelebrationsCarousel babyId={babyId} />
      </Suspense>

      {/* Today's Summary */}
      <div className="mb-6">
        <Suspense fallback={<TodaySummarySkeleton />}>
          <TodaySummaryCard
            babyAvatarBackgroundColor={baby.avatarBackgroundColor}
            babyBirthDate={baby.birthDate}
            babyName={baby.firstName}
            babyPhotoUrl={baby.photoUrl}
            measurementUnit={user?.measurementUnit || 'metric'}
          />
        </Suspense>
      </div>

      {/* Predictive Action Cards (includes Feeding, Sleep, Diaper predictions) + Quick Actions */}
      <div className="mb-6">
        <Suspense fallback={<ActivityCardsSkeleton />}>
          <ActivityCards />
        </Suspense>
      </div>

      {/* Learning Carousel - Educational content based on baby's age */}
      <Suspense fallback={<LearningCarouselSkeleton />}>
        <LearningCarousel babyId={babyId} />
      </Suspense>

      {/* Milestones Carousel - Track baby's developmental milestones */}
      <Suspense fallback={<MilestonesCarouselSkeleton />}>
        <MilestonesCarousel babyId={babyId} />
      </Suspense>

      {/* Timeline */}
      <Suspense fallback={<ActivityTimelineSkeleton />}>
        <ActivityTimeline />
      </Suspense>
    </main>
  );
}
