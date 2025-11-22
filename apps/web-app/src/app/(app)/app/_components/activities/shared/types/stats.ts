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
    napCount: number;
    totalMinutes: number;
    avgNapDuration: number | null;
  };
  previous: {
    napCount: number;
    totalMinutes: number;
    avgNapDuration: number | null;
  };
  percentageChange: {
    napCount: number | null;
    totalMinutes: number | null;
    avgNapDuration: number | null;
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
