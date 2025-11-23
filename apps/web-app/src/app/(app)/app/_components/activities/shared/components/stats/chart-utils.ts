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
  currentLabel?: string;
  previousLabel?: string;
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

/**
 * Format a date range in a concise way for mobile display
 * Uses abbreviated month names for clarity
 * For same-day ranges, shows only times
 * Examples:
 * - Same day with times: "4pm-10pm"
 * - Same month: "Nov 20-22"
 * - Different months: "Nov 28-Dec 1"
 */
function formatDateRange(startDate: Date, endDate: Date): string {
  const startMonth = startDate.toLocaleDateString('en-US', { month: 'short' });
  const startDay = startDate.getDate();
  const endMonth = endDate.toLocaleDateString('en-US', { month: 'short' });
  const endDay = endDate.getDate();

  // If same day, show times only (no date needed since it's today)
  if (startMonth === endMonth && startDay === endDay) {
    const startTime = startDate
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
      })
      .toLowerCase();
    const endTime = endDate
      .toLocaleTimeString('en-US', {
        hour: 'numeric',
        hour12: true,
      })
      .toLowerCase();
    return `${startTime}-${endTime}`;
  }

  // If same month, show month once: "Nov 20-22"
  if (startMonth === endMonth) {
    return `${startMonth} ${startDay}-${endDay}`;
  }

  // Different months: "Nov 28-Dec 1"
  return `${startMonth} ${startDay}-${endMonth} ${endDay}`;
}

export function getComparisonContent(
  timeRange: ComparisonTimeRange,
  timeRangeHours: number,
): TrendContent {
  const now = new Date();

  // Calculate current period dates
  const currentStart = new Date(
    now.getTime() - timeRangeHours * 60 * 60 * 1000,
  );
  const currentEnd = now;

  // Calculate previous period dates
  const previousStart = new Date(
    now.getTime() - timeRangeHours * 2 * 60 * 60 * 1000,
  );
  const previousEnd = currentStart;

  // Format date ranges
  const currentRange = formatDateRange(currentStart, currentEnd);
  const previousRange = formatDateRange(previousStart, previousEnd);

  const rangeLabels: Record<ComparisonTimeRange, string> = {
    '1m': '1 Month',
    '2w': '2 Weeks',
    '6h': '6 Hours',
    '7d': '7 Days',
    '12h': '12 Hours',
    '24h': '24 Hours',
    '48h': '48 Hours',
  };

  return {
    currentLabel: currentRange,
    description: `${currentRange} vs ${previousRange}`,
    previousLabel: previousRange,
    title: `Current vs Previous ${rangeLabels[timeRange]}`,
  };
}
