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
