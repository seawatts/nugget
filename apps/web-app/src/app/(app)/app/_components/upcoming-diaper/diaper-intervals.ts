/**
 * Age-based diaper change interval recommendations for babies
 * Based on pediatric care guidelines
 */

export interface DiaperIntervalData {
  intervalHours: number;
  description: string;
}

/**
 * Get recommended diaper change interval based on baby's age in days
 */
export function getDiaperIntervalByAge(ageDays: number): number {
  // Newborn (0-7 days): 2-3 hour intervals (very frequent)
  if (ageDays <= 7) {
    return 2;
  }

  // 1-4 weeks: 2-3 hour intervals
  if (ageDays <= 28) {
    return 2.5;
  }

  // 1-3 months: 2.5-3 hour intervals
  if (ageDays <= 90) {
    return 2.5;
  }

  // 3-6 months: 3-4 hour intervals
  if (ageDays <= 180) {
    return 3;
  }

  // 6-12 months: 3-4 hour intervals
  if (ageDays <= 365) {
    return 3.5;
  }

  // 12+ months: 3-4 hour intervals (transitioning to potty training)
  return 3.5;
}

/**
 * Get diaper change guidance message based on baby's age
 */
export function getDiaperGuidanceByAge(ageDays: number): string {
  // Newborn (0-7 days)
  if (ageDays <= 7) {
    return 'Newborns typically need 8-12 diaper changes per day. Check frequently for wetness and stool. Predictions are enhanced by tracking feeding patterns—babies often need changes during or shortly after feeding.';
  }

  // 1-4 weeks
  if (ageDays <= 28) {
    return 'Expect 6-10 diaper changes per day. Change immediately after bowel movements. Our predictions consider your feeding schedule for more accurate timing.';
  }

  // 1-3 months
  if (ageDays <= 90) {
    return 'Most babies need 6-8 diaper changes per day at this age. Predictions account for feeding times and sleep patterns to suggest optimal change times.';
  }

  // 3-6 months
  if (ageDays <= 180) {
    return 'Typically 5-7 diaper changes per day. Patterns become more predictable as we learn correlations between feeding, sleep, and diaper needs.';
  }

  // 6-12 months
  if (ageDays <= 365) {
    return 'Around 5-6 diaper changes per day. As solid foods increase, stool patterns change. Predictions adapt to your unique feeding and sleep routines.';
  }

  // 12+ months
  return 'About 4-6 diaper changes per day. Predictions consider daily routines including meals and naps. Consider potty training readiness signs.';
}

/**
 * Calculate baby's age in days from birth date
 */
export function calculateBabyAgeDays(birthDate: Date | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  return Math.floor(diffTime / (1000 * 60 * 60 * 24));
}
