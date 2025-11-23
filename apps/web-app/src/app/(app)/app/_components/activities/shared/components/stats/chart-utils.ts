import type { ActivityType, ComparisonTimeRange } from '../../types';

export function formatChartDate(date: Date): string {
  const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
  const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;
  return `${dayName} ${monthDay}`;
}

export function formatDayAbbreviation(date: Date): string {
  return date.toLocaleDateString('en-US', { weekday: 'short' });
}

interface TrendContent {
  title: string;
  description: string;
}

export function getTrendContent(
  activityType: ActivityType,
  _metricType?: 'count' | 'amount' | 'hours',
): TrendContent {
  switch (activityType) {
    case 'feeding':
      return {
        description: 'Last 7 days',
        title: 'Daily Feeding',
      };
    case 'sleep':
      return {
        description: 'Last 7 days',
        title: 'Daily Sleep',
      };
    case 'pumping':
      return {
        description: 'Last 7 days',
        title: 'Daily Pumping',
      };
    case 'diaper':
      return {
        description: 'Last 7 days',
        title: 'Daily Diaper Changes',
      };
    default:
      return {
        description: 'Last 7 days',
        title: 'Daily Activity',
      };
  }
}

export function getComparisonContent(
  timeRange: ComparisonTimeRange,
): TrendContent {
  const rangeLabels: Record<
    ComparisonTimeRange,
    { short: string; long: string }
  > = {
    '1m': { long: '1 Month', short: '1m' },
    '2w': { long: '2 Weeks', short: '2w' },
    '6h': { long: '6 Hours', short: '6h' },
    '7d': { long: '7 Days', short: '7d' },
    '12h': { long: '12 Hours', short: '12h' },
    '24h': { long: '24 Hours', short: '24h' },
    '48h': { long: '48 Hours', short: '48h' },
  };

  const label = rangeLabels[timeRange];

  return {
    description: `Last ${label.short} vs previous ${label.short}`,
    title: `Current vs Previous ${label.long}`,
  };
}
