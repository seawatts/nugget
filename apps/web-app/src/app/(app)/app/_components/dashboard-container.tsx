'use client';

import { api } from '@nugget/api/react';
import { useParams } from 'next/navigation';
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

  return (
    <main className="px-4 pt-4 pb-8 min-h-screen">
      {/* Celebration Card - Shows on milestone days */}
      <CelebrationsCarousel babyId={babyId} />

      {/* Today's Summary */}
      <div className="mb-6">
        <TodaySummaryCard
          babyAvatarBackgroundColor={baby?.avatarBackgroundColor}
          babyBirthDate={baby?.birthDate}
          babyName={baby?.firstName}
          babyPhotoUrl={baby?.photoUrl}
          measurementUnit={user?.measurementUnit || 'metric'}
        />
      </div>

      {/* Predictive Action Cards (includes Feeding, Sleep, Diaper predictions) + Quick Actions */}
      <div className="mb-6">
        <ActivityCards />
      </div>

      {/* Learning Carousel - Educational content based on baby's age */}
      <LearningCarousel babyId={babyId} />

      {/* Milestones Carousel - Track baby's developmental milestones */}
      <MilestonesCarousel babyId={babyId} />

      {/* Timeline */}
      <ActivityTimeline />
    </main>
  );
}
