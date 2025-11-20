import { getApi, HydrationBoundary } from '@nugget/api/rsc';
import { redirect } from 'next/navigation';
import { DashboardContainer } from '~/app/(app)/app/_components/dashboard-container';
import { ParentDashboard } from '~/app/(app)/app/_components/parent/parent-dashboard';
import { getEntityInfoAction } from './actions';

interface PageProps {
  params: Promise<{
    userId: string;
  }>;
}

export default async function UserPage({ params }: PageProps) {
  const { userId } = await params;

  // Get entity info to determine if it's a baby or user
  const result = await getEntityInfoAction({ userId });

  // If entity not found, redirect to home
  if (!result?.data) {
    redirect('/app');
  }

  const entity = result.data;

  // Render appropriate dashboard based on entity type
  if (entity.type === 'baby') {
    // Prefetch all queries on server in parallel for baby dashboard
    const api = await getApi();

    await Promise.all([
      // Baby data - used by multiple components (lightweight version without nested relations)
      api.babies.getByIdLight.prefetch({ id: userId }),
      // User preferences - used for measurement units and time format
      api.user.current.prefetch(),
      // Activities - used by TodaySummaryCard and ActivityTimeline
      api.activities.list.prefetch({
        babyId: userId,
        isScheduled: false,
        limit: 100,
      }),
      // Milestones - used by TodaySummaryCard and MilestonesCarousel
      api.milestones.list.prefetch({
        babyId: userId,
        limit: 100,
      }),
    ]);

    return (
      <HydrationBoundary>
        <DashboardContainer />
      </HydrationBoundary>
    );
  }

  return <ParentDashboard userId={userId} />;
}
