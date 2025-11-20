/**
 * Age-based sleep interval recommendations for babies
 * Based on pediatric sleep guidelines
 */

export interface SleepIntervalData {
  intervalHours: number;
  description: string;
}

/**
 * Get recommended sleep interval based on baby's age in days
 */
export function getSleepIntervalByAge(ageDays: number): number {
  // Newborn (0-7 days): 2-3 hour intervals
  if (ageDays <= 7) {
    return 2.5;
  }

  // 1-4 weeks: 2-4 hour intervals
  if (ageDays <= 28) {
    return 3;
  }

  // 1-3 months: 3-4 hour intervals
  if (ageDays <= 90) {
    return 3.5;
  }

  // 3-6 months: 3-5 hour intervals (starting to consolidate)
  if (ageDays <= 180) {
    return 4;
  }

  // 6-12 months: 4-6 hour intervals (2-3 naps per day)
  if (ageDays <= 365) {
    return 5;
  }

  // 12+ months: 5-7 hour intervals (1-2 naps per day)
  return 6;
}

/**
 * Get sleep guidance message based on baby's age
 */
export function getSleepGuidanceByAge(ageDays: number): string {
  // Newborn (0-7 days)
  if (ageDays <= 7) {
    return 'Newborns typically sleep 16-18 hours per day in short 2-3 hour intervals.';
  }

  // 1-4 weeks
  if (ageDays <= 28) {
    return 'At this age, babies sleep about 15-17 hours per day with 2-4 hour wake windows.';
  }

  // 1-3 months
  if (ageDays <= 90) {
    return 'Babies sleep 14-17 hours per day and begin to develop more regular sleep patterns.';
  }

  // 3-6 months
  if (ageDays <= 180) {
    return 'Sleep is consolidating to 12-16 hours per day with longer nighttime stretches.';
  }

  // 6-12 months
  if (ageDays <= 365) {
    return 'Most babies sleep 12-15 hours per day with 2-3 naps and longer night sleep.';
  }

  // 12+ months
  return 'Toddlers typically sleep 11-14 hours per day with 1-2 naps.';
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
