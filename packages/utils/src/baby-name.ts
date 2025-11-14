/**
 * Utility functions for handling baby names
 */

export interface BabyNameParts {
  firstName: string;
  middleName?: string | null;
  lastName?: string | null;
}

/**
 * Combines baby name parts into a full name string
 * @param baby - Object containing firstName, middleName, and lastName
 * @returns Full name as a single string
 */
export function getFullBabyName(baby: BabyNameParts): string {
  return [baby.firstName, baby.middleName, baby.lastName]
    .filter(Boolean)
    .join(' ');
}

/**
 * Parses a full name string into firstName, middleName, and lastName
 * @param fullName - The full name string to parse
 * @returns Object containing firstName, middleName, and lastName
 * @example
 * parseBabyName('John') -> { firstName: 'John', middleName: null, lastName: null }
 * parseBabyName('John Doe') -> { firstName: 'John', middleName: null, lastName: 'Doe' }
 * parseBabyName('John Michael Doe') -> { firstName: 'John', middleName: 'Michael', lastName: 'Doe' }
 * parseBabyName('John Michael David Doe') -> { firstName: 'John', middleName: 'Michael David', lastName: 'Doe' }
 */
export function parseBabyName(fullName: string): BabyNameParts {
  const trimmedName = fullName.trim();

  if (!trimmedName) {
    return { firstName: '', lastName: null, middleName: null };
  }

  const parts = trimmedName.split(/\s+/);

  if (parts.length === 1) {
    return { firstName: parts.at(0) || '', lastName: null, middleName: null };
  }

  if (parts.length === 2) {
    return {
      firstName: parts.at(0) || '',
      lastName: parts.at(1) || '',
      middleName: null,
    };
  }

  // For 3+ parts: first is firstName, last is lastName, everything in between is middleName
  const firstName = parts.at(0) || '';
  const lastName = parts.at(-1) || '';
  const middleName = parts.slice(1, -1).join(' ');

  return { firstName, lastName, middleName };
}
