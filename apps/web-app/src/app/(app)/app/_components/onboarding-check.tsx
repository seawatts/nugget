'use client';

import { usePathname, useRouter } from 'next/navigation';
import type React from 'react';
import { useEffect, useState } from 'react';

export function OnboardingCheck({ children }: { children: React.ReactNode }) {
  const router = useRouter();
  const pathname = usePathname();
  const [isChecking, setIsChecking] = useState(true);

  useEffect(() => {
    if (pathname === '/onboarding' || pathname === '/onboarding/setup') {
      setIsChecking(false);
      return;
    }

    // Check if user has completed onboarding
    const onboardingData = localStorage.getItem('onboardingData');

    if (!onboardingData) {
      router.push('/onboarding');
      // Don't set isChecking to false - keep showing loading until redirect completes
    } else {
      // Onboarding completed, allow access
      setIsChecking(false);
    }
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
