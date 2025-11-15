'use client';

import { SignOutButton as ClerkSignOutButton } from '@clerk/nextjs';
import { clearAppLocalStorage } from '~/lib/clear-local-storage';

interface SignOutButtonProps {
  children: React.ReactNode;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  const handleSignOut = () => {
    clearAppLocalStorage();
  };

  return (
    <ClerkSignOutButton signOutCallback={handleSignOut}>
      {children}
    </ClerkSignOutButton>
  );
}
