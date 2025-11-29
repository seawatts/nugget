'use client';

import { ClerkProvider as ClerkProviderBase } from '@clerk/nextjs';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { clearForceAccountSelection, isPWA } from '~/lib/pwa-utils';

interface ClerkProviderWrapperProps {
  children: React.ReactNode;
}

/**
 * Wrapper around ClerkProvider that configures sign-in URL
 * to force account selection in PWA contexts or after logout
 */
export function ClerkProviderWrapper({ children }: ClerkProviderWrapperProps) {
  const pathname = usePathname();
  const [signInUrl, setSignInUrl] = useState<string | undefined>(undefined);

  useEffect(() => {
    // Check if we're in PWA
    const pwa = isPWA();

    // Check if account selection should be forced (set during logout)
    const forceSelection =
      typeof window !== 'undefined' &&
      localStorage.getItem('force-account-selection') === 'true';

    if (pwa || forceSelection) {
      // Configure sign-in URL to include prompt=select_account
      // Clerk will pass this to the OAuth provider
      setSignInUrl('/sign-in?prompt=select_account');
    }

    // Clear the flag after successful authentication (user is on app routes)
    if (
      forceSelection &&
      pathname &&
      pathname.startsWith('/app') &&
      typeof window !== 'undefined'
    ) {
      // User successfully signed in, clear the flag
      clearForceAccountSelection();
    }
  }, [pathname]);

  return (
    <ClerkProviderBase
      afterSignOutUrl={isPWA() ? '/sign-in?prompt=select_account' : '/sign-in'}
      appearance={{
        elements: {
          // Ensure Clerk components work well in PWA
          rootBox: 'w-full',
        },
      }}
      signInUrl={signInUrl}
      signUpUrl={signInUrl}
    >
      {children}
    </ClerkProviderBase>
  );
}
