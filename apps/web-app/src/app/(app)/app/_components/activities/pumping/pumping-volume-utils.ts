/**
 * Utility functions for calculating pumping volume predictions
 * Based on baby's age and recent pumping patterns
 */

/**
 * Get three predicted pumping amounts (low, medium, high) based on baby's age
 * Returns total amounts in ml that will be split between breasts
 *
 * @param babyAgeDays - Baby's age in days (null for default values)
 * @returns Array of 3 amounts [low, medium, high] in ml
 */
export function getAgeBasedPumpingAmounts(babyAgeDays: number | null): {
  low: number;
  medium: number;
  high: number;
} {
  // If no age data, return default values for established supply
  if (babyAgeDays === null) {
    return {
      high: 210, // 7 oz
      low: 150, // 5 oz
      medium: 180, // 6 oz
    };
  }

  // Days 0-3: Colostrum phase - very small volumes expected
  if (babyAgeDays <= 3) {
    return {
      high: 15, // 0.5 oz
      low: 5, // 0.2 oz
      medium: 10, // 0.3 oz
    };
  }

  // Days 4-7: Transitional milk coming in
  if (babyAgeDays <= 7) {
    return {
      high: 75, // 2.5 oz
      low: 45, // 1.5 oz
      medium: 60, // 2 oz
    };
  }

  // Days 8-14: Early mature milk
  if (babyAgeDays <= 14) {
    return {
      high: 150, // 5 oz
      low: 90, // 3 oz
      medium: 120, // 4 oz
    };
  }

  // Days 15-30: Establishing supply
  if (babyAgeDays <= 30) {
    return {
      high: 180, // 6 oz
      low: 120, // 4 oz
      medium: 150, // 5 oz
    };
  }

  // Days 31+: Established supply
  return {
    high: 210, // 7 oz
    low: 150, // 5 oz
    medium: 180, // 6 oz
  };
}

/**
 * Get a single predicted pumping amount based on recent data or age
 * Falls back to age-based medium amount if no recent data
 *
 * @param babyAgeDays - Baby's age in days
 * @param recentAverageAmount - Average amount from recent pumping sessions (optional)
 * @returns Predicted amount in ml
 */
export function getPredictedPumpingAmount(
  babyAgeDays: number | null,
  recentAverageAmount?: number | null,
): number {
  // If we have recent average, use that
  if (recentAverageAmount && recentAverageAmount > 0) {
    return Math.round(recentAverageAmount);
  }

  // Otherwise, fall back to age-based medium amount
  const amounts = getAgeBasedPumpingAmounts(babyAgeDays);
  return amounts.medium;
}
