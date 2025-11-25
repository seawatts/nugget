import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { db } from '@nugget/db/client';
import { Users } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { redirect } from 'next/navigation';

// This page needs to run at request time to access user data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const api = await getApi();
  const { userId } = await auth();

  // Check if onboarding is complete
  const onboardingStatus = await api.onboarding.checkOnboarding();

  // If onboarding is NOT complete, redirect to onboarding
  if (!onboardingStatus.completed) {
    redirect('/app/onboarding');
  }

  // Check if user has home screen preference or last selected baby
  if (userId) {
    const user = await db.query.Users.findFirst({
      where: eq(Users.id, userId),
    });

    // Check for default home screen preference first
    if (user?.defaultHomeScreenType && user?.defaultHomeScreenId) {
      if (user.defaultHomeScreenType === 'baby') {
        redirect(`/app/babies/${user.defaultHomeScreenId}/dashboard`);
      } else if (user.defaultHomeScreenType === 'user') {
        redirect(`/app/family/${user.defaultHomeScreenId}`);
      }
    }

    // Fall back to last selected baby
    if (user?.lastSelectedBabyId) {
      redirect(`/app/babies/${user.lastSelectedBabyId}/dashboard`);
    }

    // If no preference or last selected baby, check if user has any babies
    // and redirect to the first baby's dashboard
    const babies = await api.babies.list();
    if (babies && babies.length > 0 && babies[0]) {
      redirect(`/app/babies/${babies[0].id}/dashboard`);
    }
  }

  // Redirect to babies page to select or view babies (only if no babies exist)
  redirect('/app/babies');
}
