import { auth } from '@clerk/nextjs/server';
import { api, HydrationBoundary } from '@nugget/api/rsc';
import { startOfDay, subDays } from 'date-fns';
import { updateLastSelectedBabyAction } from '../actions';
import { BabyIdCache } from './_components/baby-id-cache';
import { DashboardContainer } from './_components/dashboard-container';

interface PageProps {
  params: Promise<{
    babyId: string;
  }>;
}

export default async function BabyDashboardPage({ params }: PageProps) {
  const { babyId } = await params;

  // Prefetch ONLY critical data needed for initial render (useSuspenseQuery in DashboardContainer)
  // Everything else is wrapped in Suspense and will lazy load client-side for better performance
  const trpc = await api();

  // Critical data for DashboardContainer (blocks initial render, but needed)
  // These are non-blocking (void) so they don't delay cached responses
  void trpc.babies.getByIdLight.prefetch({ id: babyId });
  void trpc.user.current.prefetch();
  void trpc.familyMembers.all.prefetch();

  // Activities for above-the-fold action cards (ActivityCards component)
  // This prefetch ensures the data is cached before ActivityCards renders,
  // preventing a blocking query during initial render
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
  void trpc.activities.list.prefetch({
    babyId,
    limit: 200,
    since: sevenDaysAgo,
  });

  // Non-blocking: Update last selected baby and family (don't await)
  // This runs in background and won't delay cached responses
  void (async () => {
    try {
      const { orgId } = await auth();
      if (orgId) {
        await updateLastSelectedBabyAction({
          babyId,
          familyId: orgId,
        });
      }
    } catch (error) {
      // Silently fail - this is not critical for page load
      if (process.env.NODE_ENV === 'development') {
        console.warn('[Dashboard] Failed to update last selected baby', error);
      }
    }
  })();

  // NOTE: Carousels (celebrations, learning, milestones) and timeline are wrapped in Suspense
  // They fetch their own data client-side for faster initial page load

  return (
    <HydrationBoundary>
      <BabyIdCache />
      <DashboardContainer />
    </HydrationBoundary>
  );
}
