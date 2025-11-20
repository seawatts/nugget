/**
 * Hook for handling skip logic and overdue calculations for predictive activity cards
 * This logic is identical across all predictive cards (feeding, diaper, sleep, pumping)
 */

interface PredictionWithSkip {
  nextTime: Date;
  isOverdue: boolean;
  overdueMinutes?: number | null;
  recentSkipTime?: Date | string | null;
  intervalHours: number;
}

interface UseSkipLogicResult {
  isRecentlySkipped: boolean;
  effectiveIsOverdue: boolean;
  displayNextTime: Date;
}

export function useSkipLogic(
  prediction: PredictionWithSkip,
): UseSkipLogicResult {
  // Check if we should suppress overdue state due to recent skip
  const isRecentlySkipped = prediction.recentSkipTime
    ? Date.now() - new Date(prediction.recentSkipTime).getTime() <
      prediction.intervalHours * 60 * 60 * 1000
    : false;

  const effectiveIsOverdue = prediction.isOverdue && !isRecentlySkipped;

  // Calculate display time - if recently skipped, show next predicted time from skip moment
  const displayNextTime =
    isRecentlySkipped && prediction.recentSkipTime
      ? new Date(
          new Date(prediction.recentSkipTime).getTime() +
            prediction.intervalHours * 60 * 60 * 1000,
        )
      : prediction.nextTime;

  return {
    displayNextTime,
    effectiveIsOverdue,
    isRecentlySkipped,
  };
}
