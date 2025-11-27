/**
 * Activity data formatting utilities
 * Transform activity data into timeline-friendly format with colors and labels
 */

import type { Activities } from '@nugget/db/schema';
import { differenceInMinutes, format } from 'date-fns';
import {
  ACTIVITY_THEMES,
  type ActivityType,
} from '../../../shared/activity-theme-config';
import type { ActivityPosition } from './timeline-calculations';

export interface TimelineActivity {
  activity: typeof Activities.$inferSelect;
  colorVar: string; // CSS variable name (e.g., 'var(--activity-sleep)')
  colorClass: string; // Tailwind class (e.g., 'bg-activity-sleep')
  label: string;
  position: ActivityPosition;
  tooltip: string;
  laneIndex?: number;
  laneCount?: number;
}

/**
 * Map activity type to its color CSS variable
 */
export function getActivityColorVar(activityType: string): string {
  // Map activity types to their CSS variable names
  const typeMap: Record<string, ActivityType> = {
    bath: 'bath',
    both: 'diaper',
    bottle: 'bottle',
    diaper: 'diaper',
    dirty: 'diaper',
    doctor_visit: 'doctor_visit',
    feeding: 'feeding',
    growth: 'growth',
    medicine: 'medicine',
    nail_trimming: 'nail_trimming',
    nursing: 'nursing',
    potty: 'potty',
    pumping: 'pumping',
    sleep: 'sleep',
    solids: 'solids',
    temperature: 'temperature',
    tummy_time: 'tummy_time',
    vitamin_d: 'vitamin_d',
    wet: 'diaper',
  };

  const mappedType = typeMap[activityType] || 'feeding';
  const theme = ACTIVITY_THEMES[mappedType];
  return `var(--${theme.color})`;
}

/**
 * Map activity type to its color Tailwind class
 */
export function getActivityColorClass(activityType: string): string {
  const typeMap: Record<string, ActivityType> = {
    bath: 'bath',
    both: 'diaper',
    bottle: 'bottle',
    diaper: 'diaper',
    dirty: 'diaper',
    doctor_visit: 'doctor_visit',
    feeding: 'feeding',
    growth: 'growth',
    medicine: 'medicine',
    nail_trimming: 'nail_trimming',
    nursing: 'nursing',
    potty: 'potty',
    pumping: 'pumping',
    sleep: 'sleep',
    solids: 'solids',
    temperature: 'temperature',
    tummy_time: 'tummy_time',
    vitamin_d: 'vitamin_d',
    wet: 'diaper',
  };

  const mappedType = typeMap[activityType] || 'feeding';
  const theme = ACTIVITY_THEMES[mappedType];
  return `bg-${theme.color}`;
}

/**
 * Get display label for an activity type
 */
export function getActivityLabel(
  activity: typeof Activities.$inferSelect,
): string {
  const type = activity.type;
  const theme = ACTIVITY_THEMES[type as ActivityType];
  if (theme) {
    return theme.label;
  }

  // Fallback: capitalize first letter
  return type.charAt(0).toUpperCase() + type.slice(1).replace(/_/g, ' ');
}

/**
 * Format activity tooltip with details
 */
export function formatActivityTooltip(
  activity: typeof Activities.$inferSelect,
  timeFormat: '12h' | '24h' = '12h',
): string {
  const label = getActivityLabel(activity);
  const startTime = new Date(activity.startTime);
  const endTime = activity.endTime
    ? new Date(activity.endTime)
    : activity.duration
      ? new Date(startTime.getTime() + activity.duration * 60 * 1000)
      : null;

  const timeFormatStr = timeFormat === '24h' ? 'HH:mm' : 'h:mm a';

  if (endTime) {
    const durationMinutes = differenceInMinutes(endTime, startTime);
    const hours = Math.floor(durationMinutes / 60);
    const minutes = durationMinutes % 60;
    let durationStr = '';
    if (hours > 0) {
      durationStr = `${hours}h ${minutes}m`;
    } else {
      durationStr = `${minutes}m`;
    }

    return `${label}\n${format(startTime, timeFormatStr)} - ${format(endTime, timeFormatStr)}\n${durationStr}`;
  }

  return `${label}\n${format(startTime, timeFormatStr)}`;
}

/**
 * Transform activities into timeline-friendly format with positions
 */
export function formatActivitiesForTimeline(
  activities: Array<typeof Activities.$inferSelect>,
  positions: Map<string, ActivityPosition>,
  timeFormat: '12h' | '24h' = '12h',
): TimelineActivity[] {
  return activities.map((activity) => {
    const position = positions.get(activity.id);
    if (!position) {
      throw new Error(`Position not found for activity ${activity.id}`);
    }

    return {
      activity,
      colorClass: getActivityColorClass(activity.type),
      colorVar: getActivityColorVar(activity.type),
      label: getActivityLabel(activity),
      position,
      tooltip: formatActivityTooltip(activity, timeFormat),
    };
  });
}

interface LaneAssignment {
  laneCount: number;
  laneIndex: number;
}

/**
 * Assign lane metadata (lane index + total lanes) to overlapping activities so they can render side-by-side
 */
export function assignActivityLanes(
  timelineActivities: TimelineActivity[],
): TimelineActivity[] {
  if (timelineActivities.length === 0) return timelineActivities;

  const groups = groupOverlappingActivities(timelineActivities);
  const assignmentMap = new Map<string, LaneAssignment>();

  for (const group of groups) {
    const lanes: TimelineActivity[][] = [];
    for (const activity of group) {
      let placed = false;
      for (let laneIndex = 0; laneIndex < lanes.length; laneIndex++) {
        const lane = lanes[laneIndex];
        if (!lane) {
          continue;
        }
        const lastInLane = lane.at(-1);
        if (
          lastInLane &&
          activity.position.startPercent >= lastInLane.position.endPercent
        ) {
          lane.push(activity);
          assignmentMap.set(activity.activity.id, {
            laneCount: lanes.length, // temporary
            laneIndex,
          });
          placed = true;
          break;
        }
      }

      if (!placed) {
        lanes.push([activity]);
        const laneIndex = lanes.length - 1;
        assignmentMap.set(activity.activity.id, {
          laneCount: lanes.length, // temporary
          laneIndex,
        });
      }
    }

    const laneCount = lanes.length;
    for (const [laneIndex, lane] of lanes.entries()) {
      if (!lane) {
        continue;
      }
      for (const activity of lane) {
        assignmentMap.set(activity.activity.id, {
          laneCount,
          laneIndex,
        });
      }
    }
  }

  return timelineActivities.map((activity) => {
    const assignment = assignmentMap.get(activity.activity.id);
    return {
      ...activity,
      laneCount: assignment?.laneCount ?? 1,
      laneIndex: assignment?.laneIndex ?? 0,
    };
  });
}

/**
 * Group overlapping activities (for display purposes)
 * Returns activities grouped by overlapping time ranges
 */
export function groupOverlappingActivities(
  timelineActivities: TimelineActivity[],
): TimelineActivity[][] {
  if (timelineActivities.length === 0) {
    return [];
  }

  // Sort by start time
  const sorted = [...timelineActivities].sort(
    (a, b) => a.position.startPercent - b.position.startPercent,
  );

  const groups: TimelineActivity[][] = [];
  let currentGroup: TimelineActivity[] = [];

  for (const activity of sorted) {
    if (currentGroup.length === 0) {
      // Start new group
      currentGroup.push(activity);
    } else {
      // Check if this activity overlaps with any in current group
      const lastInGroup = currentGroup.at(-1);
      if (!lastInGroup) {
        currentGroup.push(activity);
        continue;
      }

      const lastEnd = lastInGroup.position.endPercent;
      const currentStart = activity.position.startPercent;

      if (currentStart < lastEnd) {
        // Overlaps - add to current group
        currentGroup.push(activity);
      } else {
        // No overlap - start new group
        groups.push(currentGroup);
        currentGroup = [activity];
      }
    }
  }

  // Add last group
  if (currentGroup.length > 0) {
    groups.push(currentGroup);
  }

  return groups;
}
