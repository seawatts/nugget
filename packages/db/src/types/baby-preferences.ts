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
    preferenceWeight?: number; // 0-1, weight for custom preferences vs predictions for feeding
  };
  pumping?: {
    amountMl?: number;
    durationMinutes?: number;
    preferenceWeight?: number; // 0-1, weight for custom preferences vs predictions for pumping
  };
  preferenceWeight?: number; // 0-1, deprecated: use feeding.preferenceWeight or pumping.preferenceWeight instead
}

export const DEFAULT_PREFERENCE_WEIGHT = 0.4; // 40% custom preference weight

/**
 * Helper function to get preference weight with fallback to default
 * @param preferences - The baby custom preferences
 * @param activityType - The activity type ('feeding' | 'pumping')
 * @returns The preference weight for the specified activity type
 */
export function getPreferenceWeight(
  preferences: BabyCustomPreferences | null | undefined,
  activityType?: 'feeding' | 'pumping',
): number {
  if (!preferences) {
    return DEFAULT_PREFERENCE_WEIGHT;
  }

  // Use per-type weight if available
  if (
    activityType === 'feeding' &&
    preferences.feeding?.preferenceWeight !== undefined
  ) {
    return preferences.feeding.preferenceWeight;
  }
  if (
    activityType === 'pumping' &&
    preferences.pumping?.preferenceWeight !== undefined
  ) {
    return preferences.pumping.preferenceWeight;
  }

  // Fallback to top-level preferenceWeight for backward compatibility
  if (preferences.preferenceWeight !== undefined) {
    return preferences.preferenceWeight;
  }

  return DEFAULT_PREFERENCE_WEIGHT;
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
