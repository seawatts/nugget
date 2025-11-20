import { getApi } from '@nugget/api/server';
import { redirect } from 'next/navigation';

// This page needs to run at request time to access user data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const api = await getApi();

  // Check if onboarding is complete
  const onboardingStatus = await api.onboarding.checkOnboarding();

  // If onboarding is NOT complete, redirect to onboarding
  if (!onboardingStatus.completed) {
    redirect('/app/onboarding');
  }

  // Redirect to babies page to select or view babies
  redirect('/app/babies');
}
