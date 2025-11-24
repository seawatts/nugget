/**
 * Type definitions for baby custom preferences
 * Used for configuring default values in quick action buttons
 */

export interface BabyCustomPreferences {
  feeding?: {
    bottleAmountMl?: number;
    bottleType?: 'formula' | 'pumped';
    nursingDurationMinutes?: number;
    preferredType?: 'bottle' | 'nursing';
  };
  pumping?: {
    amountMl?: number;
    durationMinutes?: number;
  };
  preferenceWeight?: number; // 0-1, weight for custom preferences vs predictions
}

export const DEFAULT_PREFERENCE_WEIGHT = 0.4; // 40% custom preference weight

/**
 * Helper function to get preference weight with fallback to default
 */
export function getPreferenceWeight(
  preferences: BabyCustomPreferences | null | undefined,
): number {
  return preferences?.preferenceWeight ?? DEFAULT_PREFERENCE_WEIGHT;
}

/**
 * Helper function to check if custom feeding preferences are set
 */
export function hasFeedingPreferences(
  preferences: BabyCustomPreferences | null | undefined,
): boolean {
  return !!(
    preferences?.feeding?.bottleAmountMl ||
    preferences?.feeding?.nursingDurationMinutes ||
    preferences?.feeding?.preferredType
  );
}

/**
 * Helper function to check if custom pumping preferences are set
 */
export function hasPumpingPreferences(
  preferences: BabyCustomPreferences | null | undefined,
): boolean {
  return !!(
    preferences?.pumping?.amountMl || preferences?.pumping?.durationMinutes
  );
}
