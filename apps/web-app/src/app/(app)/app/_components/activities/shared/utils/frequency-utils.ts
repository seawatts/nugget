import type { Activities } from '@nugget/db/schema';
import {
  differenceInHours,
  getDay,
  getHours,
  startOfDay,
  subDays,
} from 'date-fns';
import type {
  FrequencyHeatmapData,
  FrequencyInsights,
  TimeBlockActivity,
  TimeBlockData,
} from '../types';

/**
 * Calculate hourly frequency distribution of activities
 * Returns a heatmap showing activity count by day of week and hour
 */
export function calculateHourlyFrequency(
  activities: Array<typeof Activities.$inferSelect>,
): FrequencyHeatmapData[] {
  const frequencyMap = new Map<string, number>();

  activities.forEach((activity) => {
    const startTime = new Date(activity.startTime);
    const dayOfWeek = getDay(startTime);
    const hour = getHours(startTime);
    const key = `${dayOfWeek}-${hour}`;

    frequencyMap.set(key, (frequencyMap.get(key) || 0) + 1);

    // For activities with duration, also count the hours they span
    if (activity.duration && activity.duration > 60) {
      const durationHours = Math.floor(activity.duration / 60);
      for (let i = 1; i <= durationHours; i++) {
        const nextHour = (hour + i) % 24;
        const nextDay = hour + i >= 24 ? (dayOfWeek + 1) % 7 : dayOfWeek;
        const nextKey = `${nextDay}-${nextHour}`;
        frequencyMap.set(nextKey, (frequencyMap.get(nextKey) || 0) + 1);
      }
    }
  });

  // Convert map to array format
  const heatmapData: FrequencyHeatmapData[] = [];
  for (let day = 0; day < 7; day++) {
    for (let hour = 0; hour < 24; hour++) {
      const key = `${day}-${hour}`;
      heatmapData.push({
        count: frequencyMap.get(key) || 0,
        dayOfWeek: day,
        hour,
      });
    }
  }

  return heatmapData;
}

/**
 * Calculate time block data showing when activities occur throughout the day
 * Similar to Apple Health sleep visualization
 */
export function calculateTimeBlockData(
  activities: Array<typeof Activities.$inferSelect>,
  days = 7,
  startOffsetDays = 0,
): TimeBlockData[] {
  const timeBlocks: TimeBlockData[] = [];
  const referenceDay = startOfDay(subDays(new Date(), startOffsetDays));

  // Process last N days
  for (let i = days - 1; i >= 0; i--) {
    const currentDay = new Date(referenceDay);
    currentDay.setDate(referenceDay.getDate() - i);
    const nextDay = new Date(currentDay);
    nextDay.setDate(currentDay.getDate() + 1);

    // Filter activities for this day
    const dayActivities = activities.filter((activity) => {
      const activityStart = new Date(activity.startTime);
      return activityStart >= currentDay && activityStart < nextDay;
    });

    // Group activities by hour
    const hourlyBlocks = new Map<number, TimeBlockActivity[]>();

    dayActivities.forEach((activity) => {
      const startTime = new Date(activity.startTime);
      const hour = getHours(startTime);
      const endTime = activity.endTime ? new Date(activity.endTime) : undefined;

      if (!hourlyBlocks.has(hour)) {
        hourlyBlocks.set(hour, []);
      }

      hourlyBlocks.get(hour)?.push({
        endTime,
        startTime,
        type: activity.type,
      });

      // For activities with duration spanning multiple hours
      if (endTime) {
        const startHour = getHours(startTime);
        const endHour = getHours(endTime);
        const hourSpan =
          endHour > startHour ? endHour - startHour : 24 - startHour + endHour;

        for (let j = 1; j <= hourSpan; j++) {
          const nextHour = (hour + j) % 24;
          if (!hourlyBlocks.has(nextHour)) {
            hourlyBlocks.set(nextHour, []);
          }
        }
      }
    });

    // Convert to blocks array
    const blocks = Array.from({ length: 24 }, (_, hour) => ({
      activities: hourlyBlocks.get(hour) || [],
      count: hourlyBlocks.get(hour)?.length || 0,
      hour,
    }));

    timeBlocks.push({
      blocks,
      date: currentDay.toISOString(),
    });
  }

  return timeBlocks;
}

/**
 * Detect patterns and provide insights about activity timing
 */
export function detectPatterns(
  activities: Array<typeof Activities.$inferSelect>,
): FrequencyInsights {
  if (activities.length === 0) {
    return {
      consistencyScore: 0,
      longestGap: { from: null, hours: 0, to: null },
      peakHours: [],
    };
  }

  // Calculate hourly frequency for peak detection
  const hourlyCount = new Map<number, number>();
  activities.forEach((activity) => {
    const hour = getHours(new Date(activity.startTime));
    hourlyCount.set(hour, (hourlyCount.get(hour) || 0) + 1);
  });

  // Find peak hours (top 3)
  const peakHours = Array.from(hourlyCount.entries())
    .map(([hour, count]) => ({ count, hour }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 3);

  // Calculate consistency score based on timing variance
  const times = activities.map((a) => getHours(new Date(a.startTime)));
  const avgTime = times.reduce((sum, t) => sum + t, 0) / times.length;
  const variance =
    times.reduce((sum, t) => sum + (t - avgTime) ** 2, 0) / times.length;
  const stdDev = Math.sqrt(variance);
  // Lower variance = higher consistency
  // Normalize to 0-100 scale (assuming stdDev of 0-12 hours)
  const consistencyScore = Math.max(
    0,
    Math.min(100, 100 - (stdDev / 12) * 100),
  );

  // Find longest gap between activities
  const sortedActivities = [...activities].sort(
    (a, b) => new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
  );

  let longestGap = {
    from: null as Date | null,
    hours: 0,
    to: null as Date | null,
  };
  for (let i = 1; i < sortedActivities.length; i++) {
    const prev = sortedActivities[i - 1];
    const curr = sortedActivities[i];
    if (prev && curr) {
      const prevTime = prev.endTime
        ? new Date(prev.endTime)
        : new Date(prev.startTime);
      const currTime = new Date(curr.startTime);
      const gapHours = differenceInHours(currTime, prevTime);

      if (gapHours > longestGap.hours) {
        longestGap = {
          from: prevTime,
          hours: gapHours,
          to: currTime,
        };
      }
    }
  }

  return {
    consistencyScore: Math.round(consistencyScore),
    longestGap,
    peakHours,
  };
}

/**
 * Format hour for display (12-hour format)
 */
export function formatHour(
  hour: number,
  format: '12h' | '24h' = '12h',
): string {
  if (format === '24h') {
    return `${hour.toString().padStart(2, '0')}:00`;
  }

  const period = hour >= 12 ? 'pm' : 'am';
  const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
  return `${displayHour}${period}`;
}

/**
 * Format day of week
 */
export function formatDayOfWeek(day: number): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  return days[day] || '';
}

/**
 * Get color intensity for heatmap cell
 * Returns opacity value based on count (0-1)
 */
export function getHeatmapIntensity(count: number, maxCount: number): number {
  if (maxCount === 0) return 0;
  // Minimum opacity of 0.1 for cells with activity, max of 1.0
  return count === 0
    ? 0
    : Math.max(0.1, Math.min(1, (count / maxCount) * 0.9 + 0.1));
}
