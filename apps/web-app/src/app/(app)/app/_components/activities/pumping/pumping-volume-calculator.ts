/**
 * Calculate age-appropriate pumping volumes based on baby's age and duration
 *
 * Uses research-based volume ranges for different stages of lactation:
 * - Early colostrum phase (days 1-3): Very small volumes expected
 * - Transitional milk (days 4-14): Gradually increasing volumes
 * - Mature milk (2+ weeks): Higher, more consistent volumes
 */

interface VolumeCalculation {
  leftMl: number;
  rightMl: number;
  totalMl: number;
  isColostrum: boolean;
}

/**
 * Get base volume per session based on baby's age in days
 * Returns total expected volume in ml for a standard 20-minute session
 *
 * Based on typical pumping output (not nursing intake):
 * - Pumping typically yields 2-5 oz per session once supply is established
 * - Early days yield much less during colostrum phase
 */
function getBaseVolumeByAge(
  ageDays: number,
  babyMlPerPump?: number | null,
): number {
  // Day 1: Very early colostrum - 5-10ml total
  if (ageDays === 0 || ageDays === 1) {
    return 7.5; // Average of 5-10ml
  }

  // Days 2-3: Early colostrum - 10-20ml total
  if (ageDays <= 3) {
    return 15; // Average of 10-20ml
  }

  // Days 4-7: Transitional milk coming in - 60-90ml total (2-3 oz)
  if (ageDays <= 7) {
    return 75; // Average of 60-90ml
  }

  // Days 8-14: Early mature milk - 120-180ml total (4-6 oz)
  if (ageDays <= 14) {
    return 150; // Average of 120-180ml
  }

  // Week 2-4: Establishing supply - 150-210ml total (5-7 oz)
  if (ageDays <= 28) {
    return 180; // Average of 150-210ml
  }

  // Month 1+: Use baby's configured mlPerPump if available
  // Otherwise default to 180ml (6 oz - typical for established supply)
  return babyMlPerPump ?? 180;
}

/**
 * Check if baby is in colostrum phase (0-5 days old)
 */
export function isColostrumPhase(ageDays: number): boolean {
  return ageDays <= 5;
}

/**
 * Calculate expected pumping volumes based on baby's age and session duration
 *
 * @param ageDays - Baby's age in days since birth
 * @param durationMinutes - Pumping session duration in minutes
 * @param babyMlPerPump - Optional: Baby's configured ml per pump from settings
 * @returns Volume calculations for left, right, and total in ml
 */
export function calculatePumpingVolumes(
  ageDays: number,
  durationMinutes: number,
  babyMlPerPump?: number | null,
): VolumeCalculation {
  // Get base volume for a standard 20-minute session
  const baseVolume = getBaseVolumeByAge(ageDays, babyMlPerPump);

  // Calculate duration multiplier (20 minutes is baseline)
  const durationMultiplier = durationMinutes / 20;

  // Calculate total volume adjusted for duration
  const totalMl = Math.round(baseVolume * durationMultiplier * 2) / 2; // Round to nearest 0.5ml

  // Split equally between breasts
  const leftMl = Math.round((totalMl / 2) * 2) / 2; // Round to nearest 0.5ml
  const rightMl = Math.round((totalMl / 2) * 2) / 2; // Round to nearest 0.5ml

  return {
    isColostrum: isColostrumPhase(ageDays),
    leftMl,
    rightMl,
    totalMl,
  };
}

/**
 * Convert ml to oz (1 oz = ~29.5735 ml)
 * Uses finer precision (0.1 oz) for small volumes to avoid showing 0 oz
 */
export function mlToOz(ml: number): number {
  if (ml === 0) return 0;

  const oz = ml / 29.5735;

  // For very small volumes (< 15ml / ~0.5oz), use 0.1 oz precision
  // Ensure minimum of 0.1 oz for any non-zero value
  if (oz < 0.5) {
    const rounded = Math.round(oz * 10) / 10;
    return Math.max(0.1, rounded); // Minimum 0.1 oz for non-zero values
  }

  return Math.round(oz * 2) / 2; // Round to nearest 0.5oz
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
