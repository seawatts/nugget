import type { ActivityTypeType } from '@nugget/db/schema';
import { differenceInDays, differenceInMonths } from 'date-fns';

type ActivityType = (typeof ActivityTypeType)[keyof typeof ActivityTypeType];

/**
 * Calculate recommended bottle amount in ounces based on baby's age
 * Formula:
 * - 0-1 month: 2-4 oz per feeding
 * - 1-2 months: 3-5 oz per feeding
 * - 2-6 months: 4-6 oz per feeding
 * - 6+ months: 6-8 oz per feeding
 */
export function calculateBottleAmount(birthDate: Date): number {
  const ageInDays = differenceInDays(new Date(), birthDate);
  const ageInMonths = differenceInMonths(new Date(), birthDate);

  if (ageInDays < 30) {
    // 0-1 month
    return 3;
  }
  if (ageInMonths < 2) {
    // 1-2 months
    return 4;
  }
  if (ageInMonths < 6) {
    // 2-6 months
    return 5;
  }
  // 6+ months
  return 6;
}

/**
 * Get default activity data based on activity type and baby age
 */
export function getDefaultActivityData(
  activityType: string,
  birthDate: Date | null,
) {
  const now = new Date();

  switch (activityType) {
    case 'sleep':
      return {
        duration: null,
        endTime: null,
        startTime: now,
        type: 'sleep' as ActivityType,
      };

    case 'bottle':
      return {
        amount: birthDate ? calculateBottleAmount(birthDate) * 30 : 120, // Convert oz to ml (4oz = 120ml default)
        feedingSource: 'formula' as const,
        startTime: now,
        type: 'bottle' as ActivityType,
      };

    case 'nursing':
      return {
        startTime: now,
        type: 'nursing' as ActivityType,
      };

    case 'diaper':
      return {
        startTime: now,
        type: 'wet' as ActivityType,
      };

    case 'solids':
      return {
        startTime: now,
        type: 'solids' as ActivityType,
      };

    case 'pumping':
      return {
        startTime: now,
        type: 'pumping' as ActivityType,
      };

    case 'potty':
      return {
        startTime: now,
        type: 'potty' as ActivityType,
      };

    case 'activity':
      return {
        startTime: now,
        type: 'tummy_time' as ActivityType,
      };

    case 'tummy-time':
      return {
        startTime: now,
        type: 'tummy_time' as ActivityType,
      };

    case 'medicine':
      return {
        startTime: now,
        type: 'medicine' as ActivityType,
      };

    case 'temperature':
      return {
        startTime: now,
        type: 'temperature' as ActivityType,
      };

    case 'growth':
      return {
        startTime: now,
        type: 'growth' as ActivityType,
      };

    case 'bath':
      return {
        startTime: now,
        type: 'bath' as ActivityType,
      };

    default:
      return {
        startTime: now,
        type: activityType as ActivityType,
      };
  }
}

/**
 * Format activity for toast message
 */
export function formatActivityForToast(
  activityType: string,
  data: ReturnType<typeof getDefaultActivityData>,
): string {
  switch (activityType) {
    case 'bottle':
      return `Bottle: ${Math.round((data.amount || 0) / 30)}oz added`;
    case 'sleep':
      return 'Sleep tracking started';
    case 'nursing':
      return 'Nursing tracking started';
    case 'diaper':
      return 'Diaper change (wet) recorded';
    case 'solids':
      return 'Solid food recorded';
    case 'pumping':
      return 'Pumping session started';
    case 'potty':
      return 'Potty recorded';
    case 'tummy-time':
      return 'Tummy time started';
    case 'medicine':
      return 'Medicine recorded';
    case 'temperature':
      return 'Temperature recorded';
    case 'growth':
      return 'Growth measurement recorded';
    case 'bath':
      return 'Bath recorded';
    default:
      return 'Activity recorded';
  }
}
