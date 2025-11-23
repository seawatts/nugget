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
export type ActivityType = 'feeding' | 'diaper' | 'sleep' | 'pumping';

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
