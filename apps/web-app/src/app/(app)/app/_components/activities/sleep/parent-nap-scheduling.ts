/**
 * Parent nap scheduling utilities
 * Analyzes parent sleep patterns and coordinates nap recommendations
 * to maximize total parent sleep
 */

import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes, getHours, getMinutes, subDays } from 'date-fns';

export interface ParentNapWindow {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  reason: string;
}

export interface ParentNapRecommendation {
  userId: string;
  recommendedNaps: ParentNapWindow[];
  totalAvailableSleepMinutes: number;
  reasoning: string;
}

export interface CoordinatedNapWindow {
  startTime: Date;
  endTime: Date;
  durationMinutes: number;
  priority: 'high' | 'medium' | 'low';
  participants: string[]; // User IDs who can nap during this window
  reason: string;
}

export interface ParentSleepOverlap {
  babySleepWindow: {
    startTime: Date;
    endTime: Date;
    durationMinutes: number;
  };
  parentSleepOpportunities: Array<{
    userId: string;
    availableMinutes: number;
    canSleep: boolean;
  }>;
  bothParentsCanSleep: boolean;
}

/**
 * Calculate parent nap recommendations for a single parent
 * to maximize their total sleep
 */
export function calculateParentNapRecommendations(
  parentSleepActivities: Array<typeof Activities.$inferSelect>,
  babySleepActivities: Array<typeof Activities.$inferSelect>,
  userId: string,
  lookbackDays = 7,
): ParentNapRecommendation {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Filter to recent baby sleep activities (completed sleeps only)
  const recentBabySleeps = babySleepActivities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (!activity.endTime || !activity.startTime || !activity.duration)
        return false;
      const startTime = new Date(activity.startTime);
      return startTime >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  // Find longest baby sleep windows (best opportunities for parent naps)
  const babySleepWindows = recentBabySleeps
    .map((sleep) => {
      const start = new Date(sleep.startTime);
      const end = new Date(sleep.endTime!);
      const duration = differenceInMinutes(end, start);

      return {
        durationMinutes: duration,
        endTime: end,
        sleepType: (sleep.details as { sleepType?: 'nap' | 'night' })
          ?.sleepType,
        startTime: start,
      };
    })
    .sort((a, b) => b.durationMinutes - a.durationMinutes); // Longest first

  // Get parent's recent sleep pattern
  const parentSleeps = parentSleepActivities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (activity.userId !== userId) return false;
      if (!activity.endTime || !activity.startTime) return false;
      const startTime = new Date(activity.startTime);
      return startTime >= cutoff;
    })
    .sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );

  // Calculate parent's current sleep deficit
  const parentTotalSleepLast24h = parentSleeps
    .filter((sleep) => {
      const start = new Date(sleep.startTime);
      return start >= subDays(now, 1);
    })
    .reduce((sum, sleep) => sum + (sleep.duration || 0), 0);

  const recommendedSleepPer24h = 7 * 60; // 7 hours in minutes
  const sleepDeficit = Math.max(
    0,
    recommendedSleepPer24h - parentTotalSleepLast24h,
  );

  // Find best nap opportunities based on baby's longest sleep windows
  const recommendedNaps: ParentNapWindow[] = [];

  // Prioritize night sleep windows (longest and most predictable)
  const nightSleeps = babySleepWindows.filter(
    (w) => w.sleepType === 'night' && w.durationMinutes >= 180, // At least 3 hours
  );

  // Also look at longest nap windows
  const longNaps = babySleepWindows.filter(
    (w) => w.sleepType === 'nap' && w.durationMinutes >= 90, // At least 1.5 hours
  );

  // Combine and prioritize
  const prioritizedWindows = [
    ...nightSleeps.slice(0, 1), // Top night sleep
    ...longNaps.slice(0, 2), // Top 2 long naps
  ].slice(0, 3); // Max 3 recommendations

  for (const window of prioritizedWindows) {
    // Account for time needed to get baby to sleep and potential wake-ups
    // Reserve 15 minutes at start and 15 minutes at end
    const bufferMinutes = 30;
    const availableMinutes = Math.max(
      0,
      window.durationMinutes - bufferMinutes,
    );

    if (availableMinutes >= 60) {
      // Only recommend naps of at least 1 hour
      const napStart = new Date(window.startTime);
      napStart.setMinutes(napStart.getMinutes() + 15); // Buffer at start

      const napEnd = new Date(window.endTime);
      napEnd.setMinutes(napEnd.getMinutes() - 15); // Buffer at end

      const priority: 'high' | 'medium' | 'low' =
        window.sleepType === 'night' && window.durationMinutes >= 360
          ? 'high'
          : window.sleepType === 'night'
            ? 'medium'
            : 'low';

      const reason =
        window.sleepType === 'night'
          ? `Baby's night sleep (${Math.round((window.durationMinutes / 60) * 10) / 10} hours) - best opportunity for rest`
          : `Baby's long nap (${Math.round((window.durationMinutes / 60) * 10) / 10} hours)`;

      recommendedNaps.push({
        durationMinutes: availableMinutes,
        endTime: napEnd,
        priority,
        reason,
        startTime: napStart,
      });
    }
  }

  const totalAvailableSleepMinutes = recommendedNaps.reduce(
    (sum, nap) => sum + nap.durationMinutes,
    0,
  );

  const reasoning =
    sleepDeficit > 0
      ? `You've been getting ${Math.round((parentTotalSleepLast24h / 60) * 10) / 10} hours of sleep in the last 24h. Try to catch up during baby's longest sleep windows.`
      : recommendedNaps.length > 0
        ? `During baby's longest sleep windows, you could get up to ${Math.round((totalAvailableSleepMinutes / 60) * 10) / 10} hours of additional rest.`
        : 'Track more baby sleep data to get personalized nap recommendations.';

  return {
    reasoning,
    recommendedNaps,
    totalAvailableSleepMinutes,
    userId,
  };
}

/**
 * Find coordinated nap windows when both parents can potentially sleep
 */
export function getCoordinatedNapWindows(
  babySleepActivities: Array<typeof Activities.$inferSelect>,
  parent1Id: string,
  parent2Id: string | null,
  lookbackDays = 7,
): CoordinatedNapWindow[] {
  if (!parent2Id) {
    return []; // Can't coordinate with only one parent
  }

  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Find baby's longest, most consistent sleep windows
  const babySleeps = babySleepActivities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (!activity.endTime || !activity.startTime || !activity.duration)
        return false;
      const startTime = new Date(activity.startTime);
      return startTime >= cutoff;
    })
    .map((sleep) => {
      const start = new Date(sleep.startTime);
      const end = new Date(sleep.endTime!);
      return {
        durationMinutes: differenceInMinutes(end, start),
        endTime: end,
        sleepType: (sleep.details as { sleepType?: 'nap' | 'night' })
          ?.sleepType,
        startTime: start,
      };
    })
    .filter((w) => w.durationMinutes >= 180); // At least 3 hours

  // Group similar sleep windows by time of day
  const windowsByHour: Map<number, typeof babySleeps> = new Map();
  for (const window of babySleeps) {
    const startHour = getHours(window.startTime);
    const hourBucket = Math.floor(startHour / 3) * 3; // Group into 3-hour buckets
    if (!windowsByHour.has(hourBucket)) {
      windowsByHour.set(hourBucket, []);
    }
    windowsByHour.get(hourBucket)?.push(window);
  }

  const coordinatedWindows: CoordinatedNapWindow[] = [];

  // Find most consistent long sleep windows
  for (const [_hourBucket, windows] of windowsByHour) {
    if (windows.length < 3) continue; // Need at least 3 occurrences for consistency

    // Calculate average window
    const avgStartHour =
      windows.reduce(
        (sum, w) => sum + getHours(w.startTime) + getMinutes(w.startTime) / 60,
        0,
      ) / windows.length;
    const avgDuration =
      windows.reduce((sum, w) => sum + w.durationMinutes, 0) / windows.length;

    if (avgDuration < 240) continue; // Need at least 4 hours average

    // Create recommended window
    const startTime = new Date(now);
    startTime.setHours(Math.floor(avgStartHour), (avgStartHour % 1) * 60, 0);
    if (startTime < now) {
      startTime.setDate(startTime.getDate() + 1);
    }

    const endTime = new Date(startTime);
    endTime.setMinutes(endTime.getMinutes() + avgDuration);

    // Buffer time
    const bufferMinutes = 30;
    const availableMinutes = Math.max(0, avgDuration - bufferMinutes);

    const priority: 'high' | 'medium' | 'low' =
      windows.length >= 5 && avgDuration >= 360
        ? 'high'
        : avgDuration >= 360
          ? 'medium'
          : 'low';

    const isNightSleep = avgStartHour >= 19 || avgStartHour <= 6;

    coordinatedWindows.push({
      durationMinutes: availableMinutes,
      endTime,
      participants: [parent1Id, parent2Id],
      priority,
      reason: isNightSleep
        ? `Consistent ${Math.round((avgDuration / 60) * 10) / 10}-hour night sleep window - both parents can rest`
        : `Consistent ${Math.round((avgDuration / 60) * 10) / 10}-hour sleep window - both parents can rest`,
      startTime,
    });
  }

  // Sort by priority and duration
  return coordinatedWindows.sort((a, b) => {
    const priorityOrder = { high: 3, low: 1, medium: 2 };
    if (priorityOrder[b.priority] !== priorityOrder[a.priority]) {
      return priorityOrder[b.priority] - priorityOrder[a.priority];
    }
    return b.durationMinutes - a.durationMinutes;
  });
}

/**
 * Analyze overlap between baby sleep and parent sleep schedules
 */
export function analyzeBabyParentSleepOverlap(
  babySleepActivities: Array<typeof Activities.$inferSelect>,
  allParentSleepActivities: Array<typeof Activities.$inferSelect>,
  lookbackDays = 3,
): ParentSleepOverlap[] {
  const now = new Date();
  const cutoff = subDays(now, lookbackDays);

  // Get baby's recent sleep windows
  const babySleepWindows = babySleepActivities
    .filter((activity) => {
      if (activity.type !== 'sleep') return false;
      if (!activity.endTime || !activity.startTime) return false;
      const startTime = new Date(activity.startTime);
      return startTime >= cutoff;
    })
    .map((sleep) => {
      const start = new Date(sleep.startTime);
      const end = new Date(sleep.endTime!);
      return {
        durationMinutes: differenceInMinutes(end, start),
        endTime: end,
        startTime: start,
      };
    })
    .filter((w) => w.durationMinutes >= 180); // At least 3 hours

  // Get all unique user IDs from parent sleep activities
  const parentUserIds = [
    ...new Set(
      allParentSleepActivities
        .filter((a) => a.type === 'sleep')
        .map((a) => a.userId),
    ),
  ];

  // Analyze each baby sleep window
  return babySleepWindows.map((babyWindow) => {
    const parentOpportunities = parentUserIds.map((userId) => {
      // Check if parent has any sleep during this window
      const parentSleepsDuringWindow = allParentSleepActivities.filter(
        (activity) => {
          if (activity.type !== 'sleep') return false;
          if (activity.userId !== userId) return false;
          if (!activity.startTime || !activity.endTime) return false;

          const parentStart = new Date(activity.startTime);
          const parentEnd = new Date(activity.endTime);

          // Check for overlap
          return (
            (parentStart >= babyWindow.startTime &&
              parentStart < babyWindow.endTime) ||
            (parentEnd > babyWindow.startTime &&
              parentEnd <= babyWindow.endTime) ||
            (parentStart <= babyWindow.startTime &&
              parentEnd >= babyWindow.endTime)
          );
        },
      );

      const availableMinutes = babyWindow.durationMinutes - 30; // Buffer

      return {
        availableMinutes: Math.max(0, availableMinutes),
        canSleep:
          availableMinutes >= 60 && parentSleepsDuringWindow.length === 0,
        userId,
      };
    });

    const bothParentsCanSleep =
      parentOpportunities.length >= 2 &&
      parentOpportunities.every((p) => p.canSleep);

    return {
      babySleepWindow: {
        durationMinutes: babyWindow.durationMinutes,
        endTime: babyWindow.endTime,
        startTime: babyWindow.startTime,
      },
      bothParentsCanSleep,
      parentSleepOpportunities: parentOpportunities,
    };
  });
}

/**
 * Maximize total parent sleep by calculating optimal nap schedule
 * Considers both parents and coordinates to avoid conflicts
 */
export function maximizeParentSleep(
  babySleepActivities: Array<typeof Activities.$inferSelect>,
  allParentSleepActivities: Array<typeof Activities.$inferSelect>,
  parentIds: string[],
  lookbackDays = 7,
): {
  recommendations: ParentNapRecommendation[];
  coordinatedWindows: CoordinatedNapWindow[];
  totalPotentialSleepMinutes: number;
} {
  const recommendations: ParentNapRecommendation[] = [];

  // Calculate recommendations for each parent
  for (const parentId of parentIds) {
    const parentSleeps = allParentSleepActivities.filter(
      (activity) => activity.userId === parentId,
    );

    const recommendation = calculateParentNapRecommendations(
      parentSleeps,
      babySleepActivities,
      parentId,
      lookbackDays,
    );

    recommendations.push(recommendation);
  }

  // Find coordinated windows (if multiple parents)
  let coordinatedWindows: CoordinatedNapWindow[] = [];
  if (parentIds.length >= 2) {
    const parent1Id = parentIds[0];
    const parent2Id = parentIds[1];
    if (parent1Id && parent2Id) {
      coordinatedWindows = getCoordinatedNapWindows(
        babySleepActivities,
        parent1Id,
        parent2Id,
        lookbackDays,
      );
    }
  }

  // Calculate total potential sleep
  const individualSleepMinutes = recommendations.reduce(
    (sum, rec) => sum + rec.totalAvailableSleepMinutes,
    0,
  );

  // For coordinated windows, count them separately (don't double-count)
  // Use coordinated windows preferentially as they maximize total family sleep
  const coordinatedSleepMinutes = coordinatedWindows
    .slice(0, 2) // Top 2 coordinated windows
    .reduce(
      (sum, window) =>
        sum + window.durationMinutes * window.participants.length,
      0,
    );

  const totalPotentialSleepMinutes = Math.max(
    individualSleepMinutes,
    coordinatedSleepMinutes,
  );

  return {
    coordinatedWindows,
    recommendations,
    totalPotentialSleepMinutes,
  };
}
