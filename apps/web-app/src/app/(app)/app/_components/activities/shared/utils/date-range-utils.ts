import { format, subDays } from 'date-fns';

import type { TrendTimeRange } from '../types';

const TIME_RANGE_TO_DAYS: Record<TrendTimeRange, number> = {
  '1m': 30,
  '2w': 14,
  '3m': 90,
  '6m': 180,
  '7d': 7,
  '24h': 1,
};

export function getDateRangeLabel(
  range: TrendTimeRange,
  now: Date = new Date(),
  offsetDays = 0,
): string {
  const days = TIME_RANGE_TO_DAYS[range] ?? 7;
  const effectiveEndDate = subDays(now, offsetDays);
  const startDate = subDays(effectiveEndDate, days);
  return `${format(startDate, 'MMM d')} - ${format(effectiveEndDate, 'MMM d')}`;
}

export function getCustomDateRangeLabel(
  days: number,
  now: Date = new Date(),
): string {
  if (days <= 0) return format(now, 'MMM d');
  const endDate = now;
  const startDate = subDays(now, days);
  return `${format(startDate, 'MMM d')} - ${format(endDate, 'MMM d')}`;
}
