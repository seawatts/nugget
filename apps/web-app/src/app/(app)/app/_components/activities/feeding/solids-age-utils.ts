/**
 * Utilities for determining age-appropriate solids feeding
 */

/**
 * Minimum age in days for introducing solid foods (4 months)
 * Based on pediatric guidelines that suggest introducing solids between 4-6 months
 */
export const SOLIDS_MIN_AGE_DAYS = 120; // 4 months

/**
 * Check if baby is old enough for solid foods
 * @param ageDays - Baby's age in days (null if unknown)
 * @returns true if baby is 4+ months old, false otherwise
 */
export function isSolidsAgeAppropriate(ageDays: number | null): boolean {
  // If age is unknown, allow solids (assume user knows best)
  if (ageDays === null) {
    return true;
  }

  return ageDays >= SOLIDS_MIN_AGE_DAYS;
}

/**
 * Get educational message about solid food introduction based on baby's age
 * @param ageDays - Baby's age in days (null if unknown)
 * @returns Educational message about when to introduce solids
 */
export function getSolidsEducationalMessage(ageDays: number | null): string {
  if (ageDays === null) {
    return 'Most babies start solids around 4-6 months';
  }

  const daysUntil4Months = SOLIDS_MIN_AGE_DAYS - ageDays;
  const weeksUntil4Months = Math.ceil(daysUntil4Months / 7);

  if (ageDays < SOLIDS_MIN_AGE_DAYS) {
    if (weeksUntil4Months === 1) {
      return 'Available in about 1 week (at 4 months)';
    }
    return `Available in about ${weeksUntil4Months} weeks (at 4 months)`;
  }

  return 'Ready for solid foods!';
}

/**
 * Get detailed educational content about solid food readiness
 * @param ageDays - Baby's age in days (null if unknown)
 * @returns Object with title and description for educational content
 */
export function getSolidsReadinessInfo(ageDays: number | null): {
  title: string;
  description: string;
} {
  if (ageDays === null || ageDays >= SOLIDS_MIN_AGE_DAYS) {
    return {
      description:
        "Track your baby's solid food journey with different food types and amounts.",
      title: 'Starting Solids',
    };
  }

  return {
    description:
      'Solid foods are typically introduced around 4-6 months when baby shows signs of readiness like sitting with support and showing interest in food.',
    title: 'Coming Soon: Solid Foods',
  };
}
