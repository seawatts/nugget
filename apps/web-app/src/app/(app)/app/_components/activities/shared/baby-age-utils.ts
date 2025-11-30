import { differenceInCalendarDays } from 'date-fns';

/**
 * Baby age calculation utilities
 * Used across multiple activity types for age-appropriate calculations
 */

/**
 * Calculate baby's age in days from birth date
 * @param birthDate - Baby's birth date
 * @returns Age in days, or null if birthDate is not provided
 */
export function calculateBabyAgeDays(birthDate: Date | null): number | null {
  if (!birthDate) return null;

  const today = new Date();
  const birth = new Date(birthDate);
  const diffTime = Math.abs(today.getTime() - birth.getTime());
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));

  return diffDays;
}

/**
 * Calculate baby's age in days for a specific target date
 * @param birthDate - Baby's birth date
 * @param targetDate - The date to calculate age for (defaults to today)
 * @returns Age in days, or null if birthDate is not provided
 */
export function calculateBabyAgeDaysForDate(
  birthDate: Date | null,
  targetDate: Date = new Date(),
): number | null {
  if (!birthDate) return null;

  const birth = new Date(birthDate);
  const target = new Date(targetDate);
  const diffDays = differenceInCalendarDays(target, birth);

  return Math.max(0, diffDays);
}

/**
 * Get age-appropriate description for baby's age
 * @param ageDays - Baby's age in days
 * @returns Human-readable age description
 */
export function getAgeDescription(ageDays: number): string {
  if (ageDays === 0) return 'newborn (today)';
  if (ageDays === 1) return '1 day old';
  if (ageDays < 7) return `${ageDays} days old`;
  if (ageDays < 14) return `${Math.floor(ageDays / 7)} week old`;
  if (ageDays < 30) return `${Math.floor(ageDays / 7)} weeks old`;
  if (ageDays < 60) return `${Math.floor(ageDays / 30)} month old`;
  return `${Math.floor(ageDays / 30)} months old`;
}

/**
 * Check if baby is in newborn phase (0-28 days)
 */
export function isNewborn(ageDays: number | null): boolean {
  return ageDays !== null && ageDays <= 28;
}

/**
 * Check if baby is in infant phase (0-12 months)
 */
export function isInfant(ageDays: number | null): boolean {
  return ageDays !== null && ageDays <= 365;
}
