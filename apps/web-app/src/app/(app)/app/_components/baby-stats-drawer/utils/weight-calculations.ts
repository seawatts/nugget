/**
 * Calculate estimated weight based on age and birth weight
 * Formula from feed-calculator/page.tsx:
 * - Days 1-14: Should regain birth weight
 * - After day 14: Birth weight + (days after regain × 0.75 oz/day)
 */
export function calculateEstimatedWeight(
  ageDays: number | null,
  birthWeightOz: number | null,
): number | null {
  if (!ageDays || !birthWeightOz) return null;

  // Days 1-14: Should regain birth weight
  if (ageDays <= 14) {
    return birthWeightOz;
  }

  // After regaining birth weight, babies typically gain 0.5-1 oz per day (avg 0.75 oz/day)
  const daysAfterRegain = ageDays - 14;
  const expectedGainOz = daysAfterRegain * 0.75;
  return birthWeightOz + expectedGainOz;
}

/**
 * Convert ounces to pounds and ounces
 */
export function formatWeightOz(totalOz: number): { lbs: number; oz: number } {
  const lbs = Math.floor(totalOz / 16);
  const oz = totalOz % 16;
  return { lbs, oz };
}

/**
 * Convert ounces to kilograms and grams
 */
export function formatWeightKg(totalOz: number): { kg: number; g: number } {
  const totalGrams = totalOz * 28.3495; // 1 oz = 28.3495 g
  const kg = Math.floor(totalGrams / 1000);
  const g = Math.round(totalGrams % 1000);
  return { g, kg };
}

/**
 * Format weight for display
 */
export function formatWeightDisplay(
  totalOz: number,
  unit: 'metric' | 'imperial',
): string {
  if (unit === 'imperial') {
    const { lbs, oz } = formatWeightOz(totalOz);
    if (lbs === 0) {
      return `${oz} oz`;
    }
    if (oz === 0) {
      return `${lbs} lb${lbs !== 1 ? 's' : ''}`;
    }
    return `${lbs} lb ${oz} oz`;
  }
  const { kg, g } = formatWeightKg(totalOz);
  if (kg === 0) {
    return `${g} g`;
  }
  if (g === 0) {
    return `${kg} kg`;
  }
  return `${kg}.${Math.floor(g / 100)} kg`;
}
