'use client';

import { api } from '@nugget/api/react';
import { Icons } from '@nugget/ui/custom/icons';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { checkOnboarding } from './onboarding/actions';

const LAST_BABY_ID_KEY = 'nugget:last-baby-id';

export default function Home() {
  const router = useRouter();
  const [isResolving, setIsResolving] = useState(true);
  const utils = api.useUtils();

  useEffect(() => {
    async function resolveRoute() {
      // Check localStorage for cached babyId first (instant redirect)
      try {
        const cachedBabyId = localStorage.getItem(LAST_BABY_ID_KEY);
        if (cachedBabyId) {
          // Instant redirect to cached dashboard
          router.replace(`/app/babies/${cachedBabyId}/dashboard`);
          return;
        }
      } catch (error) {
        console.warn('[Home] Failed to read cached babyId', error);
      }

      // No cached babyId, check onboarding and get babies list
      try {
        const onboardingResult = await checkOnboarding();

        if (!onboardingResult?.data?.completed) {
          router.replace('/app/onboarding');
          return;
        }

        // Fetch babies list using tRPC utils
        const babies = await utils.babies.list.fetch();

        if (babies && babies.length > 0 && babies[0]) {
          const firstBabyId = babies[0].id;
          // Cache the babyId for next time
          try {
            localStorage.setItem(LAST_BABY_ID_KEY, firstBabyId);
          } catch (error) {
            console.warn('[Home] Failed to cache babyId', error);
          }
          router.replace(`/app/babies/${firstBabyId}/dashboard`);
          return;
        }

        // No babies, redirect to babies list page
        router.replace('/app/babies');
      } catch (error) {
        console.error('[Home] Failed to resolve route', error);
        // Fallback to babies list page
        router.replace('/app/babies');
      } finally {
        setIsResolving(false);
      }
    }

    void resolveRoute();
  }, [router, utils]);

  // Show loading state while resolving route
  if (isResolving) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-3 text-sm text-muted-foreground">
        <Icons.Spinner size="lg" variant="primary" />
        <span>Opening your dashboard…</span>
      </div>
    );
  }

  // This should not render as we redirect above, but include as fallback
  return null;
}
