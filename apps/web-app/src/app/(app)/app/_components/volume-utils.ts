/**
 * Utility functions for handling volume conversions and formatting
 */

/**
 * Convert measurement unit to volume unit
 * @param measurementUnit - 'imperial' or 'metric'
 * @returns 'OZ' for imperial, 'ML' for metric
 */
export function getVolumeUnit(
  measurementUnit: 'imperial' | 'metric' = 'metric',
): 'ML' | 'OZ' {
  return measurementUnit === 'imperial' ? 'OZ' : 'ML';
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
 * Format amount for display based on user preference
 * @param amountMl - Amount in milliliters (always stored in db as ml)
 * @param unitPref - User's preferred unit ('ML' or 'OZ')
 * @param includeUnit - Whether to include the unit in the output
 * @returns Formatted amount string
 */
export function formatVolumeDisplay(
  amountMl: number,
  unitPref: 'ML' | 'OZ' = 'ML',
  includeUnit = true,
): string {
  if (unitPref === 'OZ') {
    const oz = mlToOz(amountMl);
    return includeUnit ? `${oz}oz` : `${oz}`;
  }
  return includeUnit ? `${Math.round(amountMl)}ml` : `${Math.round(amountMl)}`;
}

/**
 * Get the appropriate step size for increment/decrement based on unit preference
 */
export function getVolumeStep(unitPref: 'ML' | 'OZ' = 'ML'): number {
  return unitPref === 'OZ' ? 0.5 : 30;
}

/**
 * Get minimum volume value based on unit preference
 */
export function getMinVolume(unitPref: 'ML' | 'OZ' = 'ML'): number {
  return unitPref === 'OZ' ? 0.5 : 30;
}

/**
 * Get quick select volume values based on unit preference
 */
export function getQuickSelectVolumes(unitPref: 'ML' | 'OZ' = 'ML'): number[] {
  return unitPref === 'OZ' ? [2, 4, 6, 8] : [60, 120, 180, 240];
}
