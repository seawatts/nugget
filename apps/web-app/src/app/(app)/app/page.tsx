import { getApi } from '@nugget/api/server';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { checkOnboarding } from './onboarding/actions';

const LAST_BABY_ID_KEY = 'nugget:last-baby-id';

// This page needs to run at request time to access cookies and user data
export const dynamic = 'force-dynamic';

export default async function Home() {
  const cookieStore = await cookies();

  // Strategy 1: Check cookie for cached babyId (instant redirect, no network calls)
  const cachedBabyId = cookieStore.get(LAST_BABY_ID_KEY)?.value;
  if (cachedBabyId) {
    // Instant server-side redirect to cached dashboard
    redirect(`/app/babies/${cachedBabyId}/dashboard`);
  }

  // Strategy 2: Check onboarding status
  try {
    const onboardingResult = await checkOnboarding();

    if (!onboardingResult?.data?.completed) {
      redirect('/app/onboarding');
    }

    // Strategy 3: Fetch babies list using server-side tRPC
    const api = await getApi();
    const babies = await api.babies.list();

    if (babies && babies.length > 0 && babies[0]) {
      const firstBabyId = babies[0].id;

      // Set cookie for next time (enables instant redirect on future visits)
      cookieStore.set(LAST_BABY_ID_KEY, firstBabyId, {
        maxAge: 60 * 60 * 24 * 365, // 1 year
        path: '/',
        sameSite: 'lax',
      });

      // Instant server-side redirect to dashboard
      redirect(`/app/babies/${firstBabyId}/dashboard`);
    }

    // No babies, redirect to babies list page
    redirect('/app/babies');
  } catch (error) {
    console.error('[Home] Failed to resolve route', error);
    // Fallback to babies list page
    redirect('/app/babies');
  }
}
