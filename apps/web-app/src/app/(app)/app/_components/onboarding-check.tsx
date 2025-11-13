'use client';

import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';
import { checkOnboarding } from '../onboarding/actions';

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    // Skip check for onboarding pages
    if (
      pathname === '/app/onboarding' ||
      pathname === '/app/onboarding/setup'
    ) {
      setIsChecking(false);
      return;
    }

    // Check if user has completed onboarding
    async function checkOnboardingStatus() {
      try {
        const result = await checkOnboarding();

        if (result?.data?.completed) {
          // Onboarding completed, allow access
          setIsChecking(false);
        } else {
          // Not completed, redirect to onboarding
          router.push('/app/onboarding');
          // Keep showing loading until redirect completes
        }
      } catch (error) {
        console.error('Failed to check onboarding status:', error);
        // Fallback to localStorage check
        const onboardingData = localStorage.getItem('onboardingData');

        if (!onboardingData) {
          router.push('/app/onboarding');
        } else {
          setIsChecking(false);
        }
      }
    }

    void checkOnboardingStatus();
  }, [pathname, router]);

  if (isChecking) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent animate-spin mx-auto" />
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
