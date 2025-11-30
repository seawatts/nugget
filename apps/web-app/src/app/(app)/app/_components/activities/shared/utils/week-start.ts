/**
 * Week start day utility functions
 * Handles user preferences and locale-based auto-detection for week start day
 */

/**
 * Detects the locale's default week start day using the browser's Intl API
 * @returns 0 for Sunday, 1 for Monday
 */
export function detectLocaleWeekStart(): 0 | 1 {
  if (typeof window === 'undefined') {
    // Server-side default to Monday (ISO 8601 standard)
    return 1;
  }

  try {
    // More reliable method: check the first day of a week in the locale

    // Alternative approach: use a library-like detection
    // Most locales use Monday (1) except US/Canada/Middle East (Sunday 0)
    const locale = navigator.language || 'en-US';

    // Check common patterns
    if (locale.startsWith('en-US') || locale.startsWith('en-CA')) {
      return 0; // Sunday
    }

    // For other locales, check using Intl.Locale if available
    if ('Locale' in Intl) {
      try {
        const localeObj = new Intl.Locale(locale);
        // Most locales default to Monday
        // We can't directly query this, but we can infer from common patterns
        const region = localeObj.region;

        // Countries that typically start on Sunday
        const sundayStartRegions = [
          'US',
          'CA',
          'SA',
          'EG',
          'IL',
          'AE',
          'JO',
          'LB',
          'SY',
        ];
        if (region && sundayStartRegions.includes(region)) {
          return 0;
        }
      } catch {
        // Fall through to default
      }
    }

    // Default to Monday (most common worldwide, ISO 8601 standard)
    return 1;
  } catch (error) {
    console.warn(
      'Failed to detect locale week start, defaulting to Monday:',
      error,
    );
    return 1; // Default to Monday
  }
}

/**
 * Get the effective week start day
 * @param userPreference - User's preference: 0 = Sunday, 1 = Monday, null = auto-detect
 * @returns 0 for Sunday, 1 for Monday
 */
export function getWeekStartDay(
  userPreference: number | null | undefined,
): 0 | 1 {
  // If user has an explicit preference, use it
  if (userPreference === 0 || userPreference === 1) {
    return userPreference;
  }

  // Otherwise, auto-detect from locale
  return detectLocaleWeekStart();
}

/**
 * Hook to get week start day from user preferences
 * This is a utility function, not a React hook - can be used in non-hook contexts
 */
export function useWeekStartDay(
  userPreference: number | null | undefined,
): 0 | 1 {
  return getWeekStartDay(userPreference);
}
