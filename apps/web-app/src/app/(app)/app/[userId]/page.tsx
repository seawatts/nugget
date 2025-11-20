import { api, HydrationBoundary } from '@nugget/api/rsc';
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
    // Prefetch all queries on server for baby dashboard
    // Using tRPC RSC pattern with Clerk auth properly wired through createTRPCContext
    const trpc = await api();

    // Prefetch in parallel - void keyword prevents awaiting
    void trpc.babies.getByIdLight.prefetch({ id: userId });
    void trpc.user.current.prefetch();
    void trpc.activities.list.prefetch({
      babyId: userId,
      isScheduled: false,
      limit: 100,
    });
    void trpc.milestones.list.prefetch({
      babyId: userId,
      limit: 100,
    });

    return (
      <HydrationBoundary>
        <DashboardContainer />
      </HydrationBoundary>
    );
  }

  return <ParentDashboard userId={userId} />;
}
