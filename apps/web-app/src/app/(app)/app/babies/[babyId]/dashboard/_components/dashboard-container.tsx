'use client';

import { api } from '@nugget/api/react';
import { startOfDay, subDays } from 'date-fns';
import { useParams } from 'next/navigation';
import { Suspense, useEffect, useMemo } from 'react';
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
import { useDashboardDataStore } from '~/stores/dashboard-data';

export function DashboardContainer() {
  const params = useParams();
  const babyId = params.babyId as string;

  // Use suspense queries to leverage prefetched data (lightweight version without nested relations)
  const [baby] = api.babies.getByIdLight.useSuspenseQuery({ id: babyId });
  const [user] = api.user.current.useSuspenseQuery();
  const [familyMembersData] = api.familyMembers.all.useSuspenseQuery();

  // Fetch last 30 days of activities once for all child components
  const thirtyDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 30)), []);
  const [activities] = api.activities.list.useSuspenseQuery({
    babyId,
    limit: 1000,
    since: thirtyDaysAgo,
  });

  // Map family members to simplified format for dashboard store
  const familyMembers = useMemo(() => {
    return familyMembersData.map((member) => ({
      avatarUrl: member.user?.avatarUrl || null,
      id: member.id,
      isCurrentUser: member.userId === user?.id,
      name: member.user?.firstName
        ? `${member.user.firstName}${member.user.lastName ? ` ${member.user.lastName}` : ''}`
        : member.user?.email || 'Unknown',
      userId: member.userId,
    }));
  }, [familyMembersData, user?.id]);

  // Populate Zustand store with shared data to avoid duplicate queries in child components
  useEffect(() => {
    useDashboardDataStore.getState().setBaby(baby ?? null);
    useDashboardDataStore.getState().setUser(user ?? null);
    useDashboardDataStore.getState().setActivities(activities ?? []);
    useDashboardDataStore.getState().setFamilyMembers(familyMembers);
  }, [baby, user, activities, familyMembers]);

  // Clear store on unmount
  useEffect(() => {
    return () => {
      useDashboardDataStore.getState().clear();
    };
  }, []);

  // Check if any activity cards are enabled
  const hasAnyActivityCards =
    baby.showFeedingCard ||
    baby.showSleepCard ||
    baby.showDiaperCard ||
    baby.showPumpingCard ||
    baby.showDoctorVisitCard ||
    baby.showNailTrimmingCard ||
    baby.showBathCard;

  // Check if everything is hidden
  const allHidden = !hasAnyActivityCards && !baby.showActivityTimeline;

  return (
    <main className="px-4 pt-4 pb-8 min-h-screen overflow-x-hidden">
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

      {/* Show message if all activity cards and timeline are hidden */}
      {allHidden && (
        <div className="bg-card border border-border rounded-2xl p-6 mb-6">
          <h3 className="text-lg font-semibold mb-2">
            Dashboard Customization
          </h3>
          <p className="text-muted-foreground mb-4">
            All activity cards and timeline are currently hidden. You can
            customize what appears on this dashboard in Settings.
          </p>
          <a
            className="inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:opacity-50 disabled:pointer-events-none ring-offset-background bg-primary text-primary-foreground hover:bg-primary/90 h-10 py-2 px-4"
            href="/app/settings/dashboard"
          >
            Go to Dashboard Settings
          </a>
        </div>
      )}

      {/* Predictive Action Cards (includes Feeding, Sleep, Diaper predictions) + Quick Actions */}
      {hasAnyActivityCards && (
        <div className="mb-6">
          <Suspense fallback={<ActivityCardsSkeleton />}>
            <ActivityCards />
          </Suspense>
        </div>
      )}

      {/* Learning Carousel - Educational content based on baby's age */}
      <Suspense fallback={<LearningCarouselSkeleton />}>
        <LearningCarousel babyId={babyId} />
      </Suspense>

      {/* Milestones Carousel - Track baby's developmental milestones */}
      <Suspense fallback={<MilestonesCarouselSkeleton />}>
        <MilestonesCarousel babyId={babyId} />
      </Suspense>

      {/* Timeline */}
      {baby.showActivityTimeline && (
        <Suspense fallback={<ActivityTimelineSkeleton />}>
          <ActivityTimeline babyId={babyId} />
        </Suspense>
      )}
    </main>
  );
}
