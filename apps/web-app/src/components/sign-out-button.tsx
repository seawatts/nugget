'use client';

import { SignOutButton as ClerkSignOutButton } from '@clerk/nextjs';
import { clearAppLocalStorage } from '~/lib/clear-local-storage';
import { isPWA, setForceAccountSelection } from '~/lib/pwa-utils';

interface SignOutButtonProps {
  children: React.ReactNode;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  const handleLogout = () => {
    // Clear app-specific localStorage
    clearAppLocalStorage();

    // If running in PWA context, set flag to force account selection on next sign-in
    if (isPWA()) {
      setForceAccountSelection();

      // Try to clear Google OAuth related cookies if accessible
      // Note: We can only clear cookies that are accessible (same domain, not httpOnly)
      // Google OAuth cookies are typically httpOnly and cross-domain, so they persist
      // The force-account-selection flag will ensure Clerk prompts for account selection
      try {
        // Clear any Google-related session storage
        const keys = Object.keys(sessionStorage);
        keys.forEach((key) => {
          if (
            key.toLowerCase().includes('google') ||
            key.toLowerCase().includes('oauth') ||
            key.toLowerCase().includes('gid')
          ) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (error) {
        // Silently fail if sessionStorage is not accessible
        console.warn('Could not clear session storage:', error);
      }
    }
  };

  return (
    <ClerkSignOutButton
      redirectUrl={isPWA() ? '/sign-in?prompt=select_account' : '/sign-in'}
    >
      <button onClick={handleLogout} type="button">
        {children}
      </button>
    </ClerkSignOutButton>
  );
}
