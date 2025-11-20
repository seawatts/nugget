/**
 * Volume conversion and utility functions
 * Handles conversions between ML and OZ, and provides unit-specific helpers
 */

/**
 * Convert milliliters to ounces (1 oz = ~29.5735 ml)
 */
export function mlToOz(ml: number): number {
  return Math.round((ml / 29.5735) * 2) / 2; // Round to nearest 0.5oz
}

/**
 * Convert ounces to milliliters (1 oz = ~29.5735 ml)
 */
export function ozToMl(oz: number): number {
  return Math.round(oz * 29.5735);
}

/**
 * Get the appropriate volume step based on unit preference
 */
export function getVolumeStep(unit: 'ML' | 'OZ'): number {
  return unit === 'OZ' ? 0.5 : 30;
}

/**
 * Get quick select volume options based on unit preference
 */
export function getQuickSelectVolumes(unit: 'ML' | 'OZ'): number[] {
  if (unit === 'OZ') {
    return [2, 3, 4, 6];
  }
  return [60, 90, 120, 180];
}

/**
 * Get age-appropriate quick select volume options for bottle feeding
 * Based on typical feeding amounts by baby age
 * @param babyAgeDays - Baby's age in days (null for default values)
 * @param unit - Unit preference ('ML' or 'OZ')
 */
export function getQuickSelectVolumesByAge(
  babyAgeDays: number | null,
  unit: 'ML' | 'OZ',
): number[] {
  // If no age data, return default values
  if (babyAgeDays === null) {
    return getQuickSelectVolumes(unit);
  }

  // Define age-based feeding volumes (in OZ and ML)
  let volumes: { ml: number[]; oz: number[] };

  if (babyAgeDays <= 2) {
    // Days 1-2 (newborn): 1-2 oz per feeding
    volumes = {
      ml: [30, 45, 60, 75],
      oz: [1, 1.5, 2, 2.5],
    };
  } else if (babyAgeDays <= 7) {
    // Days 3-7 (first week): 1-3 oz per feeding
    volumes = {
      ml: [30, 60, 75, 90],
      oz: [1, 2, 2.5, 3],
    };
  } else if (babyAgeDays <= 14) {
    // Days 8-14 (second week): 2-3 oz per feeding
    volumes = {
      ml: [60, 75, 90, 105],
      oz: [2, 2.5, 3, 3.5],
    };
  } else if (babyAgeDays <= 30) {
    // Days 15-30 (2-4 weeks): 3-4 oz per feeding
    volumes = {
      ml: [75, 90, 120, 135],
      oz: [2.5, 3, 4, 4.5],
    };
  } else if (babyAgeDays <= 60) {
    // Days 31-60 (1-2 months): 4-5 oz per feeding
    volumes = {
      ml: [90, 120, 150, 165],
      oz: [3, 4, 5, 5.5],
    };
  } else if (babyAgeDays <= 120) {
    // Days 61-120 (2-4 months): 4-6 oz per feeding
    volumes = {
      ml: [120, 150, 180, 210],
      oz: [4, 5, 6, 7],
    };
  } else if (babyAgeDays <= 180) {
    // Days 121-180 (4-6 months): 6-8 oz per feeding
    volumes = {
      ml: [150, 180, 210, 240],
      oz: [5, 6, 7, 8],
    };
  } else {
    // Days 181+ (6+ months): 6-8 oz per feeding
    volumes = {
      ml: [180, 210, 240, 270],
      oz: [6, 7, 8, 9],
    };
  }

  return unit === 'OZ' ? volumes.oz : volumes.ml;
}

/**
 * Get volume unit string based on measurement system
 */
export function getVolumeUnit(measurementUnit: string): 'ML' | 'OZ' {
  return measurementUnit === 'imperial' ? 'OZ' : 'ML';
}

/**
 * Format volume for display based on unit preference
 */
export function formatVolume(amount: number, unit: 'ML' | 'OZ'): string {
  if (unit === 'OZ') {
    return `${mlToOz(amount)}oz`;
  }
  return `${Math.round(amount)}ml`;
}

/**
 * Format volume for display with optional unit suffix
 * @param amount - Volume amount (in ml)
 * @param unit - Display unit preference ('ML' or 'OZ')
 * @param showUnit - Whether to include the unit suffix (default: false)
 */
export function formatVolumeDisplay(
  amount: number,
  unit: 'ML' | 'OZ',
  showUnit = false,
): string {
  const value = unit === 'OZ' ? mlToOz(amount) : Math.round(amount);
  return showUnit ? `${value}${unit.toLowerCase()}` : String(value);
}
