/**
 * Timeline calculation utilities
 * Functions for calculating positions, detecting collisions, and converting between time and pixel/percentage coordinates
 */

import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes, getHours, getMinutes, subHours } from 'date-fns';

export interface TimelineWindow {
  endTime: Date;
  startTime: Date;
}

export interface ActivityPosition {
  endPercent: number;
  height: number; // in minutes
  heightPercent: number;
  startPercent: number;
  startTime: Date;
}

export interface AvailableTimeSlot {
  endTime: Date;
  startTime: Date;
}

/**
 * Calculate a 12-hour window centered around a given time
 * Shows 6 hours before and 6 hours after the center time
 */
export function calculateTimelineWindow(
  centerTime: Date = new Date(),
): TimelineWindow {
  const startTime = subHours(centerTime, 6);
  const endTime = new Date(centerTime.getTime() + 6 * 60 * 60 * 1000);

  return { endTime, startTime };
}

/**
 * Filter activities that fall within the timeline window
 */
export function filterActivitiesInWindow(
  activities: Array<typeof Activities.$inferSelect>,
  window: TimelineWindow,
): Array<typeof Activities.$inferSelect> {
  return activities.filter((activity) => {
    const activityStart = new Date(activity.startTime);
    const activityEnd = activity.endTime
      ? new Date(activity.endTime)
      : new Date(
          activityStart.getTime() + (activity.duration || 30) * 60 * 1000,
        );

    // Activity overlaps if:
    // 1. Activity starts within window, OR
    // 2. Activity ends within window, OR
    // 3. Activity completely contains the window
    return (
      (activityStart >= window.startTime && activityStart < window.endTime) ||
      (activityEnd > window.startTime && activityEnd <= window.endTime) ||
      (activityStart <= window.startTime && activityEnd >= window.endTime)
    );
  });
}

/**
 * Calculate the position (percentage from top) and height for an activity on the timeline
 * Returns percentages relative to the 12-hour window
 */
export function calculateActivityPosition(
  activity: typeof Activities.$inferSelect,
  window: TimelineWindow,
): ActivityPosition | null {
  const activityStart = new Date(activity.startTime);
  const activityEnd = activity.endTime
    ? new Date(activity.endTime)
    : activity.duration
      ? new Date(activityStart.getTime() + activity.duration * 60 * 1000)
      : new Date(activityStart.getTime() + 30 * 60 * 1000); // Default 30 min if no duration

  // Calculate how many minutes from window start to activity start
  const windowStartMinutes = window.startTime.getTime() / (1000 * 60);
  const activityStartMinutes = activityStart.getTime() / (1000 * 60);
  const activityEndMinutes = activityEnd.getTime() / (1000 * 60);

  // Clamp to window bounds
  const clampedStartMinutes = Math.max(
    windowStartMinutes,
    Math.min(activityStartMinutes, windowStartMinutes + 12 * 60),
  );
  const clampedEndMinutes = Math.max(
    windowStartMinutes,
    Math.min(activityEndMinutes, windowStartMinutes + 12 * 60),
  );

  const windowDurationMinutes = 12 * 60; // 12 hours
  const startOffsetMinutes = clampedStartMinutes - windowStartMinutes;
  const endOffsetMinutes = clampedEndMinutes - windowStartMinutes;

  const startPercent = (startOffsetMinutes / windowDurationMinutes) * 100;
  const endPercent = (endOffsetMinutes / windowDurationMinutes) * 100;
  const heightPercent = endPercent - startPercent;

  // Minimum height to ensure visibility (at least 0.5%)
  const minHeightPercent = 0.5;
  const finalHeightPercent = Math.max(heightPercent, minHeightPercent);

  const height = Math.max(
    differenceInMinutes(activityEnd, activityStart),
    Math.round((minHeightPercent / 100) * windowDurationMinutes),
  );

  return {
    endPercent: Math.min(100, endPercent),
    height,
    heightPercent: Math.min(100, finalHeightPercent),
    startPercent: Math.max(0, startPercent),
    startTime: activityStart,
  };
}

/**
 * Convert a percentage position on the timeline to an absolute Date
 */
export function percentToTime(percent: number, window: TimelineWindow): Date {
  const windowDurationMs =
    window.endTime.getTime() - window.startTime.getTime();
  const offsetMs = (percent / 100) * windowDurationMs;
  return new Date(window.startTime.getTime() + offsetMs);
}

/**
 * Convert an absolute Date to a percentage position on the timeline
 */
export function timeToPercent(time: Date, window: TimelineWindow): number {
  const windowDurationMs =
    window.endTime.getTime() - window.startTime.getTime();
  const offsetMs = time.getTime() - window.startTime.getTime();
  return Math.max(0, Math.min(100, (offsetMs / windowDurationMs) * 100));
}

/**
 * Check if a time range (for sleep entry) collides with existing activities
 */
export function checkCollision(
  sleepStart: Date,
  sleepEnd: Date,
  existingActivities: Array<typeof Activities.$inferSelect>,
  window: TimelineWindow,
  excludeActivityId?: string, // Optional: exclude this activity from collision check (for editing)
): boolean {
  const filteredActivities = filterActivitiesInWindow(
    existingActivities,
    window,
  ).filter((activity) => activity.id !== excludeActivityId);

  return filteredActivities.some((activity) => {
    const activityStart = new Date(activity.startTime);
    const activityEnd = activity.endTime
      ? new Date(activity.endTime)
      : activity.duration
        ? new Date(activityStart.getTime() + activity.duration * 60 * 1000)
        : new Date(activityStart.getTime() + 30 * 60 * 1000);

    // Check for overlap
    return (
      (sleepStart >= activityStart && sleepStart < activityEnd) ||
      (sleepEnd > activityStart && sleepEnd <= activityEnd) ||
      (sleepStart <= activityStart && sleepEnd >= activityEnd)
    );
  });
}

/**
 * Find available time slots in the timeline where sleep can be inserted
 * Returns array of time ranges that are free (have no activities)
 */
export function findAvailableTimeSlots(
  activities: Array<typeof Activities.$inferSelect>,
  window: TimelineWindow,
  minSlotDurationMinutes = 15,
): AvailableTimeSlot[] {
  // Get all activity positions
  const filteredActivities = filterActivitiesInWindow(activities, window);
  const positions = filteredActivities
    .map((activity) => calculateActivityPosition(activity, window))
    .filter((pos): pos is ActivityPosition => pos !== null)
    .sort((a, b) => a.startPercent - b.startPercent);

  const slots: AvailableTimeSlot[] = [];

  // Check from window start to first activity
  if (positions.length > 0) {
    const firstPos = positions[0];
    if (firstPos && firstPos.startPercent > 0) {
      const slotStart = window.startTime;
      const slotEnd = percentToTime(firstPos.startPercent, window);
      const durationMinutes = differenceInMinutes(slotEnd, slotStart);
      if (durationMinutes >= minSlotDurationMinutes) {
        slots.push({ endTime: slotEnd, startTime: slotStart });
      }
    }
  } else {
    // No activities - entire window is available
    slots.push({ endTime: window.endTime, startTime: window.startTime });
  }

  // Check gaps between activities
  for (let i = 0; i < positions.length - 1; i++) {
    const current = positions[i];
    const next = positions[i + 1];
    if (current && next) {
      const gapStart = percentToTime(current.endPercent, window);
      const gapEnd = percentToTime(next.startPercent, window);
      const durationMinutes = differenceInMinutes(gapEnd, gapStart);
      if (durationMinutes >= minSlotDurationMinutes) {
        slots.push({ endTime: gapEnd, startTime: gapStart });
      }
    }
  }

  // Check from last activity to window end
  if (positions.length > 0) {
    const lastPos = positions.at(-1);
    if (lastPos && lastPos.endPercent < 100) {
      const slotStart = percentToTime(lastPos.endPercent, window);
      const slotEnd = window.endTime;
      const durationMinutes = differenceInMinutes(slotEnd, slotStart);
      if (durationMinutes >= minSlotDurationMinutes) {
        slots.push({ endTime: slotEnd, startTime: slotStart });
      }
    }
  }

  return slots;
}

/**
 * Snap a time to the nearest interval (e.g., 5 or 15 minutes)
 */
export function snapToInterval(time: Date, intervalMinutes = 5): Date {
  const minutes = getMinutes(time);
  const snappedMinutes =
    Math.round(minutes / intervalMinutes) * intervalMinutes;
  const snapped = new Date(time);
  snapped.setMinutes(snappedMinutes, 0, 0);
  return snapped;
}

/**
 * Calculate suggested sleep duration based on baby's age and recent sleep patterns
 * Replicates the logic from prediction.ts but as a standalone function
 */
export function calculateSuggestedSleepDuration(
  babyAgeDays: number | null,
  recentSleeps: Array<{ duration: number | null }>,
): number {
  // Age-based duration defaults (in minutes)
  let ageBasedDuration: number;

  if (babyAgeDays === null) {
    ageBasedDuration = 60; // Default 1 hour
  } else if (babyAgeDays <= 90) {
    // 0-3 months: shorter naps
    ageBasedDuration = 45;
  } else if (babyAgeDays <= 180) {
    // 3-6 months: 1-1.5 hours
    ageBasedDuration = 75;
  } else if (babyAgeDays <= 365) {
    // 6-12 months: 1-2 hours
    ageBasedDuration = 90;
  } else {
    // 12+ months: 1.5-2 hours
    ageBasedDuration = 105;
  }

  // Calculate average duration from recent sleeps
  const validDurations = recentSleeps
    .map((s) => s.duration)
    .filter((d): d is number => d !== null && d > 0 && d < 480); // Filter realistic durations (< 8 hours)

  if (validDurations.length >= 3) {
    const avgDuration =
      validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length;
    // Weight: 60% recent average, 40% age-based
    return Math.round(avgDuration * 0.6 + ageBasedDuration * 0.4);
  }

  if (validDurations.length > 0) {
    const avgDuration =
      validDurations.reduce((sum, d) => sum + d, 0) / validDurations.length;
    // Weight: 40% recent average, 60% age-based (less confidence)
    return Math.round(avgDuration * 0.4 + ageBasedDuration * 0.6);
  }

  // No recent data, use age-based
  return ageBasedDuration;
}

/**
 * Calculate hour markers for the timeline (0-12 hours)
 */
export function calculateHourMarkers(window: TimelineWindow): Array<{
  hour: number;
  percent: number;
  time: Date;
}> {
  const markers: Array<{ hour: number; percent: number; time: Date }> = [];
  const startHour = getHours(window.startTime);
  const startMinute = getMinutes(window.startTime);

  // Calculate markers for each hour in the 12-hour window
  for (let i = 0; i <= 12; i++) {
    const markerTime = new Date(window.startTime);
    markerTime.setHours(startHour + i, startMinute === 0 ? 0 : 0, 0, 0);
    const percent = timeToPercent(markerTime, window);
    markers.push({
      hour: (startHour + i) % 24,
      percent: Math.max(0, Math.min(100, percent)),
      time: markerTime,
    });
  }

  return markers;
}
