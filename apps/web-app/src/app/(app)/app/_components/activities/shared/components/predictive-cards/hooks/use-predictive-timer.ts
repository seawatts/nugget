/**
 * Hook for managing timer logic for in-progress activities
 * Used by feeding and sleep predictive cards
 */

import type { Activities } from '@nugget/db/schema';
import { useEffect, useRef, useState } from 'react';

export function usePredictiveTimer(
  inProgressActivity: typeof Activities.$inferSelect | null,
) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Timer effect - updates elapsed time every second when tracking
  useEffect(() => {
    if (inProgressActivity) {
      // Calculate initial elapsed time
      const initialElapsed = Math.floor(
        (Date.now() - new Date(inProgressActivity.startTime).getTime()) / 1000,
      );
      setElapsedTime(initialElapsed);

      // Update every second
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(inProgressActivity.startTime).getTime()) /
            1000,
        );
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
      setElapsedTime(0);
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [inProgressActivity]);

  return { elapsedTime };
}
