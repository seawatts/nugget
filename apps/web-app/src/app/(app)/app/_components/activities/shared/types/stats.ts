export interface StatsComparison {
  current: { count: number; totalMl?: number; avgAmountMl?: number | null };
  previous: { count: number; totalMl?: number; avgAmountMl?: number | null };
  percentageChange: {
    count: number | null;
    totalMl?: number | null;
    avgAmountMl?: number | null;
  };
}

export interface SleepStatsComparison {
  current: {
    sleepCount: number;
    totalMinutes: number;
    avgSleepDuration: number | null;
  };
  previous: {
    sleepCount: number;
    totalMinutes: number;
    avgSleepDuration: number | null;
  };
  percentageChange: {
    sleepCount: number | null;
    totalMinutes: number | null;
    avgSleepDuration: number | null;
  };
}

export interface DiaperStatsComparison {
  current: { total: number; wet: number; dirty: number; both: number };
  previous: { total: number; wet: number; dirty: number; both: number };
  percentageChange: {
    total: number | null;
    wet: number | null;
    dirty: number | null;
    both: number | null;
  };
}

export interface TrendData {
  date: string;
  displayDate?: string;
  count?: number;
  totalMl?: number;
  hours?: number;
  wet?: number;
  dirty?: number;
  both?: number;
  totalMinutes?: number;
  goal?: number;
}

export interface ComparisonData {
  metric: string;
  current: number;
  previous: number;
}

export interface VitaminDDay {
  date: string;
  displayDate: string;
  hasVitaminD: boolean;
}

export type MetricType = 'count' | 'amount' | 'hours';
export type AmountType = 'total' | 'average';
export type TrendTimeRange = '24h' | '7d' | '2w' | '1m' | '3m' | '6m';
export type TimelineWeekRange = 'this_week' | 'last_week' | 'two_weeks_ago';
export type HeatmapRangeValue = '7d' | '14d' | '30d' | '60d' | '90d';
export type ActivityType =
  | 'feeding'
  | 'diaper'
  | 'sleep'
  | 'pumping'
  | 'vitamin_d'
  | 'nail_trimming'
  | 'bath';

// Time range options for comparison charts
export type ComparisonTimeRange =
  | '6h'
  | '12h'
  | '24h'
  | '48h'
  | '7d'
  | '2w'
  | '1m';

export interface TimeRangeOption {
  value: ComparisonTimeRange;
  label: string;
  hours: number; // Total hours for the range
}

export const TIME_RANGE_OPTIONS: TimeRangeOption[] = [
  { hours: 6, label: '6 Hours', value: '6h' },
  { hours: 12, label: '12 Hours', value: '12h' },
  { hours: 24, label: '24 Hours', value: '24h' },
  { hours: 48, label: '48 Hours', value: '48h' },
  { hours: 168, label: '7 Days', value: '7d' },
  { hours: 336, label: '2 Weeks', value: '2w' },
  { hours: 720, label: '1 Month', value: '1m' },
];

export const TIMELINE_WEEK_OPTIONS: Array<{
  label: string;
  offsetDays: number;
  value: TimelineWeekRange;
}> = [
  { label: 'This Week', offsetDays: 0, value: 'this_week' },
  { label: 'Last Week', offsetDays: 7, value: 'last_week' },
  { label: 'Two Weeks Ago', offsetDays: 14, value: 'two_weeks_ago' },
];

export const HEATMAP_RANGE_OPTIONS: Array<{
  days: number;
  label: string;
  value: HeatmapRangeValue;
}> = [
  { days: 7, label: '7 Days', value: '7d' },
  { days: 14, label: '14 Days', value: '14d' },
  { days: 30, label: '30 Days', value: '30d' },
  { days: 60, label: '60 Days', value: '60d' },
  { days: 90, label: '90 Days', value: '90d' },
];

// Frequency visualization types
export interface FrequencyHeatmapData {
  dayOfWeek: number; // 0-6 (Sunday-Saturday)
  hour: number; // 0-23
  count: number;
}

export interface TimeBlockActivity {
  startTime: Date;
  endTime?: Date;
  type?: string;
}

export interface TimeBlockData {
  date: string;
  blocks: Array<{
    hour: number;
    count: number;
    activities: TimeBlockActivity[];
  }>;
}

export interface FrequencyInsights {
  peakHours: Array<{ hour: number; count: number }>;
  consistencyScore: number; // 0-100
  longestGap: { hours: number; from: Date | null; to: Date | null };
}

export type FrequencyViewType = 'heatmap' | 'timeblock';

// Stat card types
export type StatTimePeriod =
  | 'this_week'
  | 'last_week'
  | 'last_2_weeks'
  | 'last_month'
  | 'last_3_months'
  | 'last_6_months';

export type StatMetricType =
  | 'count'
  | 'amount'
  | 'average'
  | 'total'
  | 'duration';

export interface StatTimePeriodOption {
  value: StatTimePeriod;
  label: string;
  days: number;
}

export const STAT_TIME_PERIOD_OPTIONS: StatTimePeriodOption[] = [
  { days: 7, label: 'This Week', value: 'this_week' },
  { days: 7, label: 'Last Week', value: 'last_week' },
  { days: 14, label: 'Last 2 Weeks', value: 'last_2_weeks' },
  { days: 30, label: 'Last Month', value: 'last_month' },
  { days: 90, label: 'Last 3 Months', value: 'last_3_months' },
  { days: 180, label: 'Last 6 Months', value: 'last_6_months' },
];

// Stat pivot/aggregation types
export type StatPivotPeriod =
  | 'total'
  | 'per_day'
  | 'per_week'
  | 'per_month'
  | 'per_hour';

export interface StatPivotPeriodOption {
  value: StatPivotPeriod;
  label: string;
}

export const STAT_PIVOT_PERIOD_OPTIONS: StatPivotPeriodOption[] = [
  { label: 'Total', value: 'total' },
  { label: 'Per Hour', value: 'per_hour' },
  { label: 'Per Day', value: 'per_day' },
  { label: 'Per Week', value: 'per_week' },
  { label: 'Per Month', value: 'per_month' },
];

/**
 * Get pivot period options filtered based on the selected time period.
 * Hides "Per Month" if the time period is less than 1 month.
 */
export function getPivotPeriodOptionsForTimePeriod(
  timePeriod: StatTimePeriod,
): StatPivotPeriodOption[] {
  const isLessThanOneMonth =
    timePeriod === 'this_week' ||
    timePeriod === 'last_week' ||
    timePeriod === 'last_2_weeks';

  if (isLessThanOneMonth) {
    return STAT_PIVOT_PERIOD_OPTIONS.filter(
      (option) => option.value !== 'per_month',
    );
  }

  return STAT_PIVOT_PERIOD_OPTIONS;
}
