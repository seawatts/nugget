'use client';

import { cn } from '@nugget/ui/lib/utils';
import { RefreshCw } from 'lucide-react';

interface MutationStatusIndicatorProps {
  isRetrying: boolean;
  failureCount: number;
  className?: string;
}

/**
 * A small indicator that shows when mutations are being retried
 * Displays a spinning icon with retry count when retries are in progress
 */
export function MutationStatusIndicator({
  isRetrying,
  failureCount,
  className,
}: MutationStatusIndicatorProps) {
  if (!isRetrying || failureCount === 0) {
    return null;
  }

  return (
    <div
      aria-live="polite"
      className={cn(
        'flex items-center gap-1.5 text-xs text-amber-600 dark:text-amber-400',
        className,
      )}
    >
      <RefreshCw className="size-3.5 animate-spin" />
      <span>Retrying ({failureCount}/3)...</span>
    </div>
  );
}

/**
 * Hook-based indicator that connects to useActivityMutations
 * Use this in components that have access to the mutations hook
 */
export function useMutationStatusProps(mutations: {
  isRetrying: boolean;
  createFailureCount: number;
  updateFailureCount: number;
  deleteFailureCount: number;
}) {
  const totalFailures =
    mutations.createFailureCount +
    mutations.updateFailureCount +
    mutations.deleteFailureCount;

  return {
    failureCount: totalFailures,
    isRetrying: mutations.isRetrying,
  };
}
