/**
 * Measurement conversion and utility functions
 * Handles conversions between imperial and metric units
 */

/**
 * Convert kilograms to pounds (1 kg = 2.20462 lbs)
 */
export function kgToLbs(kg: number): number {
  return Math.round(kg * 2.20462 * 10) / 10; // Round to 1 decimal
}

/**
 * Convert pounds to kilograms (1 lb = 0.453592 kg)
 */
export function lbsToKg(lbs: number): number {
  return Math.round(lbs * 0.453592 * 10) / 10; // Round to 1 decimal
}

/**
 * Convert centimeters to inches (1 cm = 0.393701 in)
 */
export function cmToInches(cm: number): number {
  return Math.round(cm * 0.393701 * 10) / 10; // Round to 1 decimal
}

/**
 * Convert inches to centimeters (1 in = 2.54 cm)
 */
export function inchesToCm(inches: number): number {
  return Math.round(inches * 2.54 * 10) / 10; // Round to 1 decimal
}

/**
 * Format weight display based on user preference
 */
export function formatWeightDisplay(
  weightKg: number,
  unit: 'imperial' | 'metric',
): string {
  if (unit === 'imperial') {
    const lbs = kgToLbs(weightKg);
    return `${lbs} lbs`;
  }
  return `${weightKg} kg`;
}

/**
 * Format length display based on user preference
 */
export function formatLengthDisplay(
  lengthCm: number,
  unit: 'imperial' | 'metric',
): string {
  if (unit === 'imperial') {
    const inches = cmToInches(lengthCm);
    return `${inches} in`;
  }
  return `${lengthCm} cm`;
}

/**
 * Get weight unit label based on preference
 */
export function getWeightUnitLabel(unit: 'imperial' | 'metric'): string {
  return unit === 'imperial' ? 'lbs' : 'kg';
}

/**
 * Get length unit label based on preference
 */
export function getLengthUnitLabel(unit: 'imperial' | 'metric'): string {
  return unit === 'imperial' ? 'in' : 'cm';
}
