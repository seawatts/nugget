/**
 * Calculate age-appropriate feeding interval based on baby's age in days
 * Returns interval in hours between feedings
 */
export function getFeedingIntervalByAge(ageDays: number): number {
  // Days 1-2: every 2-3 hours (8-12 feeds/day)
  if (ageDays <= 2) {
    return 2.5;
  }

  // Days 3-7: every 2.5-3 hours (8-10 feeds/day)
  if (ageDays <= 7) {
    return 2.75;
  }

  // Days 8-14: every 3 hours (8 feeds/day)
  if (ageDays <= 14) {
    return 3;
  }

  // Days 15-30: every 3-4 hours (6-8 feeds/day)
  if (ageDays <= 30) {
    return 3.5;
  }

  // Days 31-60: every 4 hours (6 feeds/day)
  if (ageDays <= 60) {
    return 4;
  }

  // Days 61+: every 4-5 hours (5-6 feeds/day)
  return 4.5;
}

/**
 * Get age-appropriate feeding guidance message
 */
export function getFeedingGuidanceByAge(ageDays: number): string {
  if (ageDays <= 2) {
    return 'Newborns need frequent feeding every 2-3 hours, even at night.';
  }

  if (ageDays <= 7) {
    return 'Feed on demand every 2.5-3 hours. Watch for hunger cues.';
  }

  if (ageDays <= 14) {
    return 'Feedings typically occur every 3 hours as baby grows.';
  }

  if (ageDays <= 30) {
    return 'Baby may start spacing out feedings to 3-4 hours.';
  }

  if (ageDays <= 60) {
    return 'Most babies settle into a 4-hour feeding schedule.';
  }

  return 'Feedings typically occur every 4-5 hours at this age.';
}
