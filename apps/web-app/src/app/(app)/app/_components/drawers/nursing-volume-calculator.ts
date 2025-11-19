/**
 * Calculate age-appropriate nursing volumes based on baby's age and duration
 *
 * Uses research-based volume ranges for different stages of lactation:
 * - Early colostrum phase (days 1-3): Very small volumes expected
 * - Transitional milk (days 4-14): Gradually increasing volumes
 * - Mature milk (2+ weeks): Higher, more consistent volumes
 */

interface VolumeCalculation {
  totalMl: number;
  isColostrum: boolean;
}

/**
 * Get base volume per nursing session based on baby's age in days
 * Returns total expected volume in ml for a standard nursing session
 */
function getBaseVolumeByAge(ageDays: number): number {
  // Day 1: Very early colostrum - 5-10ml total
  if (ageDays === 0 || ageDays === 1) {
    return 7.5; // Average of 5-10ml
  }

  // Days 2-3: Early colostrum - 10-20ml total
  if (ageDays <= 3) {
    return 15; // Average of 10-20ml
  }

  // Days 4-7: Transitional milk coming in - 30-60ml total
  if (ageDays <= 7) {
    return 45; // Average of 30-60ml
  }

  // Days 8-14: Early mature milk - 60-90ml total
  if (ageDays <= 14) {
    return 75; // Average of 60-90ml
  }

  // Week 2-4: Establishing supply - 60-90ml total
  if (ageDays <= 28) {
    return 75; // Average of 60-90ml
  }

  // Month 1+: Established supply - typical 90ml per nursing session
  return 90;
}

/**
 * Check if baby is in colostrum phase (0-5 days old)
 */
export function isColostrumPhase(ageDays: number): boolean {
  return ageDays <= 5;
}

/**
 * Calculate expected nursing volumes based on baby's age and session duration
 *
 * @param ageDays - Baby's age in days since birth
 * @param durationMinutes - Nursing session duration in minutes (left + right combined)
 * @returns Volume calculations for total in ml
 */
export function calculateNursingVolumes(
  ageDays: number,
  durationMinutes: number,
): VolumeCalculation {
  // Get base volume for a standard session
  const baseVolume = getBaseVolumeByAge(ageDays);

  // Calculate duration multiplier (20 minutes is baseline for a full nursing session)
  const durationMultiplier = durationMinutes / 20;

  // Calculate total volume adjusted for duration
  const totalMl = Math.round(baseVolume * durationMultiplier * 2) / 2; // Round to nearest 0.5ml

  return {
    isColostrum: isColostrumPhase(ageDays),
    totalMl,
  };
}

/**
 * Convert ml to oz (1 oz = ~29.5735 ml)
 */
export function mlToOz(ml: number): number {
  return Math.round((ml / 29.5735) * 2) / 2; // Round to nearest 0.5oz
}

/**
 * Convert oz to ml (1 oz = ~29.5735 ml)
 */
export function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
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
