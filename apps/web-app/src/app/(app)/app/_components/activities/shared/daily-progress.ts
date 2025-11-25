import type { Activities } from '@nugget/db/schema';
import { startOfDay } from 'date-fns';
import {
  calculateTodaysDiaperStats,
  getDailyDiaperGoal,
} from '../diaper/diaper-goals';
import {
  calculateTodaysFeedingStats,
  getDailyAmountGoal,
  getDailyFeedingGoal,
} from '../feeding/feeding-goals';
import {
  calculateTodaysSleepStats,
  getDailySleepHoursGoal,
} from '../sleep/sleep-goals';
import { formatVolumeDisplay } from './volume-utils';

const clampPercentage = (value: number) => Math.max(0, Math.min(100, value));

const emptyProgress = (label: string): BaseProgressResult => ({
  currentValue: 0,
  goalValue: null,
  percentage: 0,
  srLabel: label,
});

const filterSinceStartOfDay = (
  activities: Array<typeof Activities.$inferSelect> | null | undefined,
): Array<typeof Activities.$inferSelect> => {
  const todayStart = startOfDay(new Date());
  const source = activities ?? [];
  return source.filter(
    (activity) => new Date(activity.startTime) >= todayStart,
  );
};

interface BaseProgressResult {
  currentValue: number;
  goalValue: number | null;
  percentage: number;
  srLabel: string;
}

export interface SleepProgressInput {
  activities?: Array<typeof Activities.$inferSelect> | null;
  babyAgeDays?: number | null;
}

export function getSleepDailyProgress({
  activities = [],
  babyAgeDays = null,
}: SleepProgressInput): BaseProgressResult | null {
  const normalizedActivities = activities ?? [];
  if (!normalizedActivities.length) {
    return emptyProgress('No sleep logged yet today');
  }

  const stats = calculateTodaysSleepStats(normalizedActivities);
  const goalHours =
    typeof babyAgeDays === 'number'
      ? getDailySleepHoursGoal(babyAgeDays)
      : null;
  const goalMinutes = goalHours ? goalHours * 60 : null;
  const percentage = goalMinutes
    ? clampPercentage((stats.totalSleepMinutes / goalMinutes) * 100)
    : 0;
  const srLabel = goalMinutes
    ? `${formatMinutes(stats.totalSleepMinutes)} of ${formatMinutes(goalMinutes, true)} sleep logged today`
    : `${formatMinutes(stats.totalSleepMinutes)} sleep logged today`;

  return {
    currentValue: stats.totalSleepMinutes,
    goalValue: goalMinutes,
    percentage,
    srLabel,
  };
}

export interface DiaperProgressInput {
  activities?: Array<typeof Activities.$inferSelect> | null;
  babyAgeDays?: number | null;
  predictedIntervalHours?: number | null;
  dataPointsCount?: number;
}

export function getDiaperDailyProgress({
  activities = [],
  babyAgeDays = null,
  predictedIntervalHours,
  dataPointsCount,
}: DiaperProgressInput): BaseProgressResult | null {
  const normalizedActivities = activities ?? [];
  if (!normalizedActivities.length) {
    return emptyProgress('No diaper changes logged yet today');
  }

  const stats = calculateTodaysDiaperStats(normalizedActivities);
  const goalCount =
    typeof babyAgeDays === 'number'
      ? getDailyDiaperGoal(babyAgeDays, predictedIntervalHours, dataPointsCount)
      : null;
  const percentage = goalCount
    ? clampPercentage((stats.count / goalCount) * 100)
    : 0;
  const srLabel = goalCount
    ? `${stats.count} of ${goalCount} diaper changes logged today`
    : `${stats.count} diaper changes logged today`;

  return {
    currentValue: stats.count,
    goalValue: goalCount,
    percentage,
    srLabel,
  };
}

export interface FeedingProgressInput {
  activities?: Array<typeof Activities.$inferSelect> | null;
  babyAgeDays?: number | null;
  predictedIntervalHours?: number | null;
  dataPointsCount?: number;
  unitPreference?: 'ML' | 'OZ';
}

export function getFeedingDailyProgress({
  activities = [],
  babyAgeDays = null,
  predictedIntervalHours,
  dataPointsCount,
  unitPreference = 'ML',
}: FeedingProgressInput): BaseProgressResult | null {
  const normalizedActivities = activities ?? [];
  if (!normalizedActivities.length) {
    return emptyProgress('No feedings logged yet today');
  }

  const todaysFeedings = filterSinceStartOfDay(normalizedActivities).filter(
    (activity) =>
      activity.type === 'bottle' ||
      activity.type === 'nursing' ||
      activity.type === 'solids',
  );

  if (!todaysFeedings.length) {
    const goalCount =
      typeof babyAgeDays === 'number'
        ? getDailyFeedingGoal(
            babyAgeDays,
            predictedIntervalHours,
            dataPointsCount,
          )
        : null;
    return {
      currentValue: 0,
      goalValue: goalCount,
      percentage: 0,
      srLabel: goalCount
        ? `0 of ${goalCount} feedings logged today`
        : 'No feedings logged today',
    };
  }

  const stats = calculateTodaysFeedingStats(todaysFeedings);
  const currentMl = stats.totalMl;
  const goalMl =
    typeof babyAgeDays === 'number'
      ? getDailyAmountGoal(
          babyAgeDays,
          'ML',
          predictedIntervalHours,
          dataPointsCount,
        )
      : null;
  const percentage = goalMl ? clampPercentage((currentMl / goalMl) * 100) : 0;
  const srLabel = goalMl
    ? `${formatVolumeDisplay(currentMl, unitPreference, true)} of ${formatVolumeDisplay(goalMl, unitPreference, true)} logged today`
    : `${formatVolumeDisplay(currentMl, unitPreference, true)} logged today`;

  return {
    currentValue: currentMl,
    goalValue: goalMl,
    percentage,
    srLabel,
  };
}

function formatMinutes(minutes: number, forceHours = false): string {
  if (minutes <= 0) {
    return '0m';
  }
  if (minutes < 60 && !forceHours) {
    return `${minutes}m`;
  }

  const hours = minutes / 60;
  if (Number.isInteger(hours)) {
    return `${hours}h`;
  }

  return `${hours.toFixed(1)}h`;
}

export interface VitaminDProgressInput {
  activities?: Array<typeof Activities.$inferSelect> | null;
  babyAgeDays?: number | null;
}

export function getVitaminDDailyProgress({
  activities = [],
  babyAgeDays: _babyAgeDays = null,
}: VitaminDProgressInput): BaseProgressResult | null {
  const normalizedActivities = activities ?? [];
  if (!normalizedActivities.length) {
    return emptyProgress('No vitamin D logged yet today');
  }

  // Filter to today's vitamin D activities
  const todaysVitaminD = filterSinceStartOfDay(normalizedActivities).filter(
    (activity) => activity.type === 'vitamin_d',
  );

  // Count today's vitamin D doses
  const count = todaysVitaminD.length;
  const goalCount = 1; // Always 1 dose per day

  const percentage =
    goalCount > 0 ? clampPercentage((count / goalCount) * 100) : 0;
  const srLabel = goalCount
    ? `${count} of ${goalCount} vitamin D doses logged today`
    : `${count} vitamin D doses logged today`;

  return {
    currentValue: count,
    goalValue: goalCount,
    percentage,
    srLabel,
  };
}
