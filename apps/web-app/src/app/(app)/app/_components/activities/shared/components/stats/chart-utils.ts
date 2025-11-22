import type { ActivityType } from '../../types';

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
  metricType?: 'count' | 'amount' | 'hours',
): TrendContent {
  switch (activityType) {
    case 'feeding':
      return {
        description: 'Last 7 days',
        title: metricType === 'count' ? 'Daily Feeding Count' : 'Daily Feeding',
      };
    case 'sleep':
      return {
        description: 'Last 7 days',
        title: metricType === 'count' ? 'Daily Nap Count' : 'Daily Sleep',
      };
    case 'pumping':
      return {
        description: 'Last 7 days',
        title: metricType === 'count' ? 'Daily Pumping Count' : 'Daily Pumping',
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

export function getComparisonContent(): TrendContent {
  return {
    description: 'Last 24h vs previous 24h',
    title: 'Current vs Previous 24 Hours',
  };
}
