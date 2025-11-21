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

  // Check if user has a last selected baby
  if (userId) {
    const user = await db.query.Users.findFirst({
      where: eq(Users.id, userId),
    });

    if (user?.lastSelectedBabyId) {
      // Redirect to last selected baby's dashboard
      redirect(`/app/babies/${user.lastSelectedBabyId}`);
    }
  }

  // Redirect to babies page to select or view babies
  redirect('/app/babies');
}
