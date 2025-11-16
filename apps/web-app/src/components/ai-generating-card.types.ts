import type { ColorConfig } from './feature-card.types';

/**
 * Function type for generating dynamic loading messages
 * @param babyName - The baby's name to personalize the message
 * @param ageInDays - The baby's age in days for context
 * @returns A personalized message string
 */
export type GeneratingMessage = (babyName: string, ageInDays: number) => string;

export interface AIGeneratingCardProps {
  /**
   * The baby's name for personalized messages
   */
  babyName: string;

  /**
   * The baby's age in days for context
   */
  ageInDays: number;

  /**
   * Array of message functions that will cycle through during generation
   * Each function receives babyName and ageInDays as parameters
   */
  messages: GeneratingMessage[];

  /**
   * Optional variant for predefined color schemes
   * Defaults to 'primary' if not specified
   */
  variant?: 'primary' | 'info' | 'success' | 'warning' | 'custom';

  /**
   * Optional custom color configuration
   * Required when variant is 'custom'
   */
  colorConfig?: ColorConfig;

  /**
   * Optional subtitle text displayed below the cycling message
   * Defaults to "This may take a moment..."
   */
  subtitle?: string;

  /**
   * Optional interval in milliseconds for message cycling
   * Defaults to 2000ms (2 seconds)
   */
  cycleInterval?: number;
}

export type { ColorConfig };
