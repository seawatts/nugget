import { differenceInCalendarDays } from 'date-fns';
import type { TrendTimeRange } from '../types/stats';

export interface GoalContextInput {
  babyBirthDate?: Date | string | null;
  babyAgeDays?: number | null;
  predictedIntervalHours?: number | null;
  dataPointsCount?: number;
}

export interface NormalizedGoalContext {
  babyBirthDate?: Date | null;
  babyAgeDays?: number | null;
  predictedIntervalHours?: number | null;
  dataPointsCount?: number;
}

export function normalizeGoalContext(
  context?: GoalContextInput | null,
): NormalizedGoalContext | null {
  if (!context) return null;

  return {
    babyAgeDays:
      typeof context.babyAgeDays === 'number' ? context.babyAgeDays : null,
    babyBirthDate: resolveDate(context.babyBirthDate),
    dataPointsCount: context.dataPointsCount,
    predictedIntervalHours: context.predictedIntervalHours ?? null,
  };
}

export function getAgeDaysForDate(
  date: Date,
  context: NormalizedGoalContext,
): number | null {
  if (context.babyBirthDate) {
    return Math.max(0, differenceInCalendarDays(date, context.babyBirthDate));
  }

  if (typeof context.babyAgeDays === 'number') {
    const today = new Date();
    const offset = differenceInCalendarDays(date, today);
    return Math.max(0, context.babyAgeDays + offset);
  }

  return null;
}

export function adjustGoalForRange(
  value: number | null | undefined,
  timeRange: TrendTimeRange,
): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  if (timeRange === '24h') {
    return value / 24;
  }
  if (timeRange === '3m' || timeRange === '6m') {
    return value * 7;
  }
  return value;
}

function resolveDate(value?: Date | string | null): Date | null {
  if (!value) return null;
  if (value instanceof Date) {
    return Number.isNaN(value.getTime()) ? null : value;
  }
  const parsed = new Date(value);
  return Number.isNaN(parsed.getTime()) ? null : parsed;
}
