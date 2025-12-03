'use client';

import { useEffect } from 'react';
import { MutationRecovery } from '~/lib/sync/mutation-recovery';

/**
 * Component that handles mutation recovery on app startup
 * Checks for incomplete mutations and retries them automatically
 */
export function MutationRecoveryHandler() {
  useEffect(() => {
    // Run recovery on mount (app startup)
    const recovery = MutationRecovery.getInstance();
    recovery.recoverIncompleteMutations().catch((error) => {
      console.error('Failed to recover mutations:', error);
    });
  }, []);

  return null;
}
