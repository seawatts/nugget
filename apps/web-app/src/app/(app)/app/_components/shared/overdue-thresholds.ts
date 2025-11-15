/**
 * Dynamic overdue thresholds based on activity type and baby age
 * These thresholds help determine when a prediction is considered overdue
 * and adjust based on the baby's developmental stage
 */

export type ActivityType = 'feeding' | 'sleep' | 'diaper' | 'pumping';

/**
 * Calculate age-appropriate overdue threshold in minutes
 *
 * @param activityType - Type of activity (feeding, sleep, or diaper)
 * @param babyAgeDays - Baby's age in days (null defaults to newborn thresholds)
 * @returns Threshold in minutes after which prediction is considered overdue
 */
export function getOverdueThreshold(
  activityType: ActivityType,
  babyAgeDays: number | null,
): number {
  // Default to newborn thresholds if age is not provided
  const ageDays = babyAgeDays ?? 0;

  switch (activityType) {
    case 'feeding':
      return getFeedingOverdueThreshold(ageDays);
    case 'sleep':
      return getSleepOverdueThreshold(ageDays);
    case 'diaper':
      return getDiaperOverdueThreshold(ageDays);
    case 'pumping':
      return getPumpingOverdueThreshold(ageDays);
  }
}

/**
 * Feeding overdue thresholds by age
 * Newborns need more frequent feeding, so shorter thresholds
 * Older babies can wait longer, so more generous thresholds
 */
function getFeedingOverdueThreshold(ageDays: number): number {
  // 0-7 days: Very strict (15 minutes)
  if (ageDays <= 7) {
    return 15;
  }

  // 8-14 days: Still strict (20 minutes)
  if (ageDays <= 14) {
    return 20;
  }

  // 15-30 days: Slightly more flexible (25 minutes)
  if (ageDays <= 30) {
    return 25;
  }

  // 31-60 days: More flexible (30 minutes)
  if (ageDays <= 60) {
    return 30;
  }

  // 61-90 days: Flexible (35 minutes)
  if (ageDays <= 90) {
    return 35;
  }

  // 90+ days: Most flexible (45 minutes)
  return 45;
}

/**
 * Sleep overdue thresholds by age
 * Sleep schedules are more variable, so we use more flexible thresholds
 */
function getSleepOverdueThreshold(ageDays: number): number {
  // 0-7 days: Newborns sleep erratically (20 minutes)
  if (ageDays <= 7) {
    return 20;
  }

  // 8-14 days: Still erratic (25 minutes)
  if (ageDays <= 14) {
    return 25;
  }

  // 15-30 days: Patterns emerging (30 minutes)
  if (ageDays <= 30) {
    return 30;
  }

  // 31-60 days: More predictable (40 minutes)
  if (ageDays <= 60) {
    return 40;
  }

  // 61-90 days: Established patterns (50 minutes)
  if (ageDays <= 90) {
    return 50;
  }

  // 90+ days: Very established (60 minutes)
  return 60;
}

/**
 * Diaper overdue thresholds by age
 * Diaper changes are the most flexible, as timing can vary significantly
 */
function getDiaperOverdueThreshold(ageDays: number): number {
  // 0-7 days: Newborns need frequent changes (30 minutes)
  if (ageDays <= 7) {
    return 30;
  }

  // 8-14 days: Still frequent (40 minutes)
  if (ageDays <= 14) {
    return 40;
  }

  // 15-30 days: More flexible (50 minutes)
  if (ageDays <= 30) {
    return 50;
  }

  // 31-60 days: Flexible (60 minutes)
  if (ageDays <= 60) {
    return 60;
  }

  // 61-90 days: More flexible (75 minutes)
  if (ageDays <= 90) {
    return 75;
  }

  // 90+ days: Most flexible (90 minutes)
  return 90;
}

/**
 * Pumping overdue thresholds by age
 * Important to maintain supply with regular pumping intervals
 */
function getPumpingOverdueThreshold(ageDays: number): number {
  // 0-7 days: Establishing supply is critical (20 minutes)
  if (ageDays <= 7) {
    return 20;
  }

  // 8-14 days: Building supply (25 minutes)
  if (ageDays <= 14) {
    return 25;
  }

  // 15-30 days: Maintaining consistent schedule (30 minutes)
  if (ageDays <= 30) {
    return 30;
  }

  // 31-60 days: More flexible but still important (40 minutes)
  if (ageDays <= 60) {
    return 40;
  }

  // 61-90 days: Established supply (45 minutes)
  if (ageDays <= 90) {
    return 45;
  }

  // 90+ days: Most flexible (60 minutes)
  return 60;
}

/**
 * Get a descriptive message explaining the overdue threshold
 * Useful for UI tooltips or help text
 */
export function getOverdueThresholdDescription(
  activityType: ActivityType,
  babyAgeDays: number | null,
): string {
  const threshold = getOverdueThreshold(activityType, babyAgeDays);
  const ageDays = babyAgeDays ?? 0;

  let ageContext = '';
  if (ageDays <= 7) {
    ageContext = 'newborns need frequent care';
  } else if (ageDays <= 30) {
    ageContext = 'young babies need regular care';
  } else if (ageDays <= 90) {
    ageContext = 'babies this age are developing patterns';
  } else {
    ageContext = 'babies this age have more flexible schedules';
  }

  return `Marked overdue after ${threshold} minutes because ${ageContext}`;
}
