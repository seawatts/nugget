/**
 * Calculate age-appropriate pumping interval based on baby's age in days
 * Returns interval in hours between pumping sessions
 *
 * Note: Pumping schedules vary significantly based on:
 * - Exclusive pumping vs supplemental pumping
 * - Return to work timing
 * - Milk supply goals
 *
 * These are general guidelines for maintaining milk supply
 */
export function getPumpingIntervalByAge(ageDays: number): number {
  // Days 1-14: Establishing supply - every 2-3 hours (8-12 times/day)
  if (ageDays <= 14) {
    return 2.5;
  }

  // Days 15-30: Building supply - every 3 hours (8 times/day)
  if (ageDays <= 30) {
    return 3;
  }

  // Days 31-60: Established supply - every 3-4 hours (6-8 times/day)
  if (ageDays <= 60) {
    return 3.5;
  }

  // Days 61+: Maintaining supply - every 3-4 hours (6-8 times/day)
  // Can drop to 5-6 times/day if supplementing or not exclusively pumping
  return 3.5;
}

/**
 * Calculate baby's age in days from birth date
 */
export function calculateBabyAgeDays(birthDate: Date | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Get age-appropriate pumping guidance message
 */
export function getPumpingGuidanceByAge(ageDays: number): string {
  if (ageDays <= 14) {
    return 'Pump every 2-3 hours to establish milk supply, including at least once at night.';
  }

  if (ageDays <= 30) {
    return 'Aim for 8 pumping sessions per day to build and maintain your supply.';
  }

  if (ageDays <= 60) {
    return 'Continue regular pumping every 3-4 hours to maintain established supply.';
  }

  return 'Pump 6-8 times per day to maintain supply. Some may drop to 5-6 sessions if supplementing.';
}
