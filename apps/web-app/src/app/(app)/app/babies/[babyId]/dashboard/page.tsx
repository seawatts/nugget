import { auth } from '@clerk/nextjs/server';
import { api, HydrationBoundary } from '@nugget/api/rsc';
import { updateLastSelectedBabyAction } from '../actions';
import { DashboardContainer } from './_components/dashboard-container';

interface PageProps {
  params: Promise<{
    babyId: string;
  }>;
}

export default async function BabyDashboardPage({ params }: PageProps) {
  const { babyId } = await params;

  // Get family ID from auth
  const { orgId } = await auth();

  // Update last selected baby and family
  if (orgId) {
    void updateLastSelectedBabyAction({
      babyId,
      familyId: orgId,
    });
  }

  // Prefetch all queries on server for baby dashboard
  // Using tRPC RSC pattern with Clerk auth properly wired through createTRPCContext
  const trpc = await api();

  // Prefetch all queries on server using tRPC - void keyword prevents awaiting
  void trpc.babies.getByIdLight.prefetch({ id: babyId });
  void trpc.user.current.prefetch();
  void trpc.familyMembers.all.prefetch();
  void trpc.activities.list.prefetch({
    babyId: babyId,
    isScheduled: false,
    limit: 1000,
  });
  void trpc.milestones.list.prefetch({
    babyId: babyId,
    limit: 100,
  });

  // Prefetch carousel content using tRPC (replaces server action calls!)
  void trpc.learning.getCarouselContent.prefetch({ babyId });
  void trpc.milestonesCarousel.getCarouselContent.prefetch({ babyId });
  void trpc.celebrations.getCarouselContent.prefetch({ babyId });

  return (
    <HydrationBoundary>
      <DashboardContainer />
    </HydrationBoundary>
  );
}
