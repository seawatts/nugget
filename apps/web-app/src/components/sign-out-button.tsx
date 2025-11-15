'use client';

import { SignOutButton as ClerkSignOutButton } from '@clerk/nextjs';
import { clearAppLocalStorage } from '~/lib/clear-local-storage';

interface SignOutButtonProps {
  children: React.ReactNode;
}

export function SignOutButton({ children }: SignOutButtonProps) {
  return (
    <ClerkSignOutButton>
      <button
        onClick={() => {
          clearAppLocalStorage();
        }}
        type="button"
      >
        {children}
      </button>
    </ClerkSignOutButton>
  );
}
