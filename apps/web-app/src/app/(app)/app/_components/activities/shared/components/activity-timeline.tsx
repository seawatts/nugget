'use client';

import { api } from '@nugget/api/react';
import type { Activities, Users } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { cn } from '@nugget/ui/lib/utils';
import { differenceInMinutes, subHours } from 'date-fns';
import {
  Activity,
  Award,
  Baby,
  Bath,
  Clock,
  Droplet,
  Droplets,
  Heart,
  MessageSquare,
  Milk,
  Moon,
  Pill,
  Scale,
  Scissors,
  Stethoscope,
  Thermometer,
  Timer,
  Tablet as Toilet,
  UtensilsCrossed,
} from 'lucide-react';
import { useMemo } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { formatVolumeDisplay } from '../volume-utils';

// Type for activity with user relation (as returned by activities.list query with user relation)
export type ActivityWithUser = typeof Activities.$inferSelect & {
  user: typeof Users.$inferSelect | null;
};

// Activity icons mapping (from activity-timeline.tsx)
const activityIcons: Record<string, typeof Moon> = {
  activity: Activity,
  bath: Bath,
  bottle: Milk,
  chat: MessageSquare,
  diaper: Baby,
  doctor_visit: Stethoscope,
  growth: Scale,
  medicine: Pill,
  milestone: Award,
  nail_trimming: Scissors,
  nursing: Droplet,
  parent_wellness: Heart,
  potty: Toilet,
  pumping: Droplets,
  sleep: Moon,
  solids: UtensilsCrossed,
  temperature: Thermometer,
  'tummy-time': Timer,
  vitamin_d: Pill,
};

/**
 * Calculate the end time of an activity
 * Sleep activities have endTime, others use startTime + duration
 */
export function getActivityEndTime(activity: ActivityWithUser): Date {
  if (activity.type === 'sleep' && activity.endTime) {
    return new Date(activity.endTime);
  }
  if (activity.duration) {
    const endTime = new Date(activity.startTime);
    endTime.setMinutes(endTime.getMinutes() + activity.duration);
    return endTime;
  }
  // If no duration, assume it's a point-in-time activity (like diaper change)
  return new Date(activity.startTime);
}

/**
 * Format activity details for display
 */
function formatActivityDetails(
  activity: ActivityWithUser,
  userUnitPref?: 'ML' | 'OZ',
): string | null {
  if (activity.type === 'sleep' && activity.duration) {
    return `${activity.duration} min`;
  }
  if (activity.type === 'nursing' && activity.duration) {
    const details = activity.details as {
      side?: 'left' | 'right' | 'both';
      type: 'nursing';
    } | null;
    const side = details?.side;
    const sideIndicator =
      side === 'left' ? ' (L)' : side === 'right' ? ' (R)' : '';
    return `${activity.duration} min${sideIndicator}`;
  }
  if (activity.amountMl != null && userUnitPref) {
    // For feeding activities with volume
    return formatVolumeDisplay(activity.amountMl, userUnitPref, true);
  }
  return null;
}

interface ActivityTimelineProps {
  /** Number of activities to show */
  activityCount: number;
  /** Baby ID for fetching activities */
  babyId: string;
  /** Time format preference */
  timeFormat: '12h' | '24h';
  /** Optional filter for activity types (if not provided, shows all) */
  activityTypes?: string[];
  /** Optional callback when clicking activity icon */
  onActivityClick?: (activity: ActivityWithUser) => void;
  /** Optional callback when clicking duration segment between activities */
  onDurationClick?: (
    previousActivity: ActivityWithUser | null,
    nextActivity: ActivityWithUser | null,
  ) => void;
  /** Whether to show activity details below time (default: true) */
  showActivityDetails?: boolean;
  /** User unit preference for volume display (ML or OZ) */
  userUnitPref?: 'ML' | 'OZ';
  /** Additional CSS classes */
  className?: string;
  /** Icon color class (default: uses activity type color) */
  iconColorClass?: string;
  /** Line segment color class (default: uses muted colors) */
  lineColorClass?: string;
  /** Whether to show a "now" icon at the end (default: false) */
  showNowIcon?: boolean;
}

export function ActivityTimeline({
  activityCount,
  babyId,
  timeFormat,
  activityTypes,
  onActivityClick,
  onDurationClick,
  showActivityDetails = true,
  userUnitPref,
  className,
  iconColorClass,
  lineColorClass,
  showNowIcon = false,
}: ActivityTimelineProps) {
  // Fetch recent activities (last 24 hours)
  const twentyFourHoursAgo = useMemo(() => subHours(new Date(), 24), []);
  const { data: recentActivities = [] } = api.activities.list.useQuery(
    {
      babyId,
      limit: 100,
      since: twentyFourHoursAgo,
    },
    {
      enabled: Boolean(babyId),
      staleTime: 30000, // Refresh every 30 seconds for timeline
    },
  );

  // Get optimistic activities
  const optimisticActivities = useOptimisticActivitiesStore(
    (state) => state.activities,
  );

  // Merge recent activities with optimistic activities
  const timelineActivities = useMemo(() => {
    const map = new Map<string, ActivityWithUser>();

    // First, add all real activities
    (recentActivities ?? []).forEach((activity) => {
      map.set(activity.id, activity);
    });

    // Then, merge optimistic activities
    optimisticActivities.forEach((activity) => {
      const existingActivity = map.get(activity.id);
      if (existingActivity) {
        // Real activity exists - merge user relation from optimistic if real doesn't have it
        const mergedActivity = {
          ...existingActivity,
          user: existingActivity.user ?? activity.user ?? null,
        } as ActivityWithUser;
        map.set(activity.id, mergedActivity);
      } else {
        // No real activity yet - use optimistic with user relation
        const activityWithUser = {
          ...activity,
          user: activity.user ?? null,
        } as ActivityWithUser;
        map.set(activity.id, activityWithUser);
      }
    });
    return Array.from(map.values());
  }, [recentActivities, optimisticActivities]);

  // Get last N activities, sorted by time (oldest first)
  const recentActivitiesList = useMemo(() => {
    const filtered = timelineActivities
      .filter((activity) => {
        // Filter by activity types if provided
        if (
          activityTypes &&
          activityTypes.length > 0 &&
          !activityTypes.includes(activity.type)
        ) {
          return false;
        }
        return (
          !activity.isScheduled &&
          !(
            activity.details &&
            'skipped' in activity.details &&
            activity.details.skipped === true
          )
        );
      })
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      ) // Most recent first
      .slice(0, activityCount) // Take last N
      .reverse(); // Reverse to show oldest to newest (left to right)

    return filtered;
  }, [timelineActivities, activityTypes, activityCount]);

  // If no activities, show message
  if (recentActivitiesList.length === 0) {
    return (
      <div className={cn('mt-8 -mx-6 px-6 py-8 text-center', className)}>
        <p className="text-sm text-muted-foreground">
          No recent activities. Add activities to see them on the timeline.
        </p>
      </div>
    );
  }

  const includeNowIcon = showNowIcon && recentActivitiesList.length > 0;
  // Timeline items include a trailing null placeholder when showing the "now" icon
  const timelineItems = includeNowIcon
    ? [...recentActivitiesList, null]
    : [...recentActivitiesList];

  // Calculate total items (activities + now icon if enabled)
  const totalItems = timelineItems.length;

  // Calculate position for each activity (evenly spaced)
  const getPosition = (index: number, isNowIcon = false): number => {
    if (isNowIcon) {
      return 100; // Now icon is always at the end
    }
    if (totalItems === 1) return 50; // Center if only one
    if (totalItems === 2) {
      return index === 0 ? 0 : 100;
    }
    if (totalItems === 4) {
      // Special positioning for 4 items
      if (index === 0) return 0;
      if (index === 1) return 35;
      if (index === 2) return 65;
      if (index === 3) return 100;
    }
    // Default: evenly spaced
    return (index / (totalItems - 1)) * 100;
  };

  // Format time interval between activities (e.g., "1h 30min")
  const formatInterval = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${mins}min`;
    }
    return `${minutes}min`;
  };

  return (
    <div className={cn('mt-8 space-y-3 -mx-6 px-2', className)}>
      {/* Timeline track */}
      <div className="relative px-6 w-full">
        {/* Timeline with segments between icons using flex */}
        <div className="flex items-center h-1 w-full">
          {timelineItems.map((item, index) => {
            const isNowIconItem = item === null;
            const isLast = index === timelineItems.length - 1;

            if (isNowIconItem) {
              return (
                <div className="flex items-center min-w-0" key="now-icon">
                  <div className="relative flex flex-col items-center shrink-0 z-10">
                    <Clock
                      className={cn(
                        'size-5',
                        iconColorClass || 'text-foreground',
                      )}
                    />
                  </div>
                </div>
              );
            }

            const activity = item;
            const ActivityIcon = (activityIcons[activity.type] ??
              activityIcons.activity) as React.ComponentType<{
              className?: string;
            }>;

            // Get user info for avatar - always show avatar, use fallback if no user
            const user = activity.user;
            const userInitials = user
              ? (user.firstName?.[0] || user.email[0] || '?').toUpperCase()
              : '?';
            const userName = user
              ? [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                user.email
              : 'Unknown';
            const userAvatarUrl = user?.avatarUrl || null;

            // Determine next/previous activities for the segment AFTER this activity
            // The segment is rendered after the current activity, so:
            // - previousActivity = current activity (the one we're rendering the segment after)
            // - nextActivity = the next activity in the list (or null if it's the "now" icon)
            const nextItem = !isLast ? timelineItems[index + 1] : null;
            const nextActivity =
              nextItem && nextItem !== null ? nextItem : null;
            const previousActivity = activity; // Current activity is the "previous" for the segment
            const isNextItemNowIcon = nextItem === null && includeNowIcon;

            // Calculate interval minutes - handle "now" case when next item is the "now" icon
            const intervalMinutes = nextActivity
              ? differenceInMinutes(
                  new Date(nextActivity.startTime),
                  getActivityEndTime(activity),
                )
              : isNextItemNowIcon
                ? differenceInMinutes(new Date(), getActivityEndTime(activity))
                : null;

            // Determine icon color
            const defaultIconColor = iconColorClass || 'text-foreground';
            const defaultLineColor = lineColorClass || 'bg-muted';

            return (
              <div
                className={`flex items-center min-w-0 ${!isLast ? 'flex-1' : ''}`}
                key={activity.id}
              >
                {/* Icon container */}
                <div className="relative shrink-0 z-10">
                  {onActivityClick ? (
                    <button
                      className="relative flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => onActivityClick(activity)}
                      type="button"
                    >
                      {/* Avatar above icon - positioned absolutely - always show */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                        <Avatar className="size-4 shrink-0">
                          <AvatarImage
                            alt={userName}
                            src={userAvatarUrl || undefined}
                          />
                          <AvatarFallback className="text-[8px]">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* Icon - always on the line */}
                      <ActivityIcon
                        className={cn('size-5', defaultIconColor)}
                      />
                    </button>
                  ) : (
                    <div className="relative flex flex-col items-center">
                      {/* Avatar above icon - positioned absolutely - always show */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                        <Avatar className="size-4 shrink-0">
                          <AvatarImage
                            alt={userName}
                            src={userAvatarUrl || undefined}
                          />
                          <AvatarFallback className="text-[8px]">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* Icon - always on the line */}
                      <ActivityIcon
                        className={cn('size-5', defaultIconColor)}
                      />
                    </div>
                  )}
                </div>

                {/* Line segment after icon (show if there's a next item, including "now" icon) */}
                {(!isLast || isNextItemNowIcon) &&
                  (onDurationClick ? (
                    <button
                      aria-label="Set time between activities"
                      className="relative flex-1 min-w-0 cursor-pointer hover:opacity-80 transition-opacity group py-3 -my-3"
                      onClick={() =>
                        onDurationClick(previousActivity, nextActivity)
                      }
                      type="button"
                    >
                      {/* Visual line segment - centered in the larger touch area */}
                      <div className="absolute inset-x-0 top-1/2 -translate-y-1/2 h-1">
                        <div
                          className={cn(
                            'absolute inset-0 rounded-full',
                            defaultLineColor,
                            'group-hover:opacity-70',
                          )}
                        />
                      </div>
                      {/* Duration label */}
                      {intervalMinutes !== null && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap group-hover:text-foreground">
                            {formatInterval(intervalMinutes)}
                          </span>
                        </div>
                      )}
                    </button>
                  ) : (
                    <div className="relative flex-1 h-1 min-w-0">
                      {/* Line segment */}
                      <div
                        className={cn(
                          'absolute inset-0 rounded-full',
                          defaultLineColor,
                        )}
                      />
                      {/* Duration label */}
                      {intervalMinutes !== null && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                          <span className="text-xs font-medium text-muted-foreground whitespace-nowrap">
                            {formatInterval(intervalMinutes)}
                          </span>
                        </div>
                      )}
                    </div>
                  ))}
              </div>
            );
          })}
        </div>
      </div>

      {/* Bottom row: exact time + activity details */}
      <div className="relative px-6 w-full min-h-[35px] pt-1">
        {timelineItems.map((item, index) => {
          const isNowIconItem = item === null;
          const position = getPosition(index, isNowIconItem);
          const isFirst = index === 0;
          const isLast = index === timelineItems.length - 1;

          if (isNowIconItem) {
            return (
              <div
                className="absolute top-1 flex flex-col gap-0.5 items-end -translate-x-full"
                key="time-now"
                style={{ left: `calc(${position}% + 0.625rem - 2.5rem)` }}
              >
                <span className="text-xs font-medium text-foreground leading-tight whitespace-nowrap">
                  {formatTimeWithPreference(new Date(), timeFormat)}
                </span>
                <span className="text-xs text-muted-foreground leading-tight whitespace-nowrap">
                  Now
                </span>
              </div>
            );
          }

          const activity = item;
          const activityTime = new Date(activity.startTime);
          const exactTime = formatTimeWithPreference(activityTime, timeFormat);
          const activityDetails = showActivityDetails
            ? formatActivityDetails(activity, userUnitPref)
            : null;

          // Determine alignment based on position
          let alignmentClass = 'items-center';
          let transformClass = '-translate-x-1/2';
          let leftStyle = `${position}%`;

          if (isFirst) {
            alignmentClass = 'items-start';
            transformClass = 'translate-x-0';
            // Position at icon center, then offset to left edge, then add padding
            leftStyle = `calc(${position}% - 0.625rem + 2.5rem)`;
          } else if (isLast) {
            alignmentClass = 'items-end';
            transformClass = '-translate-x-full';
            // Position at icon center, then offset to right edge, then subtract padding
            leftStyle = `calc(${position}% + 0.625rem - 2.5rem)`;
          }

          const TimeDisplay = onActivityClick ? 'button' : 'div';

          return (
            <TimeDisplay
              className={cn(
                `absolute top-1 flex flex-col gap-0.5 ${alignmentClass} ${transformClass}`,
                onActivityClick &&
                  'cursor-pointer hover:opacity-80 transition-opacity',
              )}
              key={`time-${activity.id}`}
              onClick={
                onActivityClick ? () => onActivityClick(activity) : undefined
              }
              style={{ left: leftStyle }}
              type={onActivityClick ? 'button' : undefined}
            >
              <span className="text-xs font-medium text-foreground leading-tight whitespace-nowrap">
                {exactTime}
              </span>
              {activityDetails && (
                <span className="text-xs text-muted-foreground leading-tight whitespace-nowrap">
                  {activityDetails}
                </span>
              )}
            </TimeDisplay>
          );
        })}

        {/* Now time display (if enabled) */}
        {showNowIcon && recentActivitiesList.length > 0 && (
          <div
            className="absolute top-1 flex flex-col gap-0.5 items-end -translate-x-full"
            style={{
              left: 'calc(100% + 0.625rem - 2.5rem)',
            }}
          >
            <span className="text-xs font-medium text-foreground leading-tight whitespace-nowrap">
              {formatTimeWithPreference(new Date(), timeFormat)}
            </span>
            <span className="text-xs text-muted-foreground leading-tight whitespace-nowrap">
              Now
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
