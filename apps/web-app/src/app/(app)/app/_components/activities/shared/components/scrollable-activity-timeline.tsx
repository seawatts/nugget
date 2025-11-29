'use client';

import { api } from '@nugget/api/react';
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
import { useEffect, useMemo, useRef } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { formatVolumeDisplay } from '../volume-utils';
import { type ActivityWithUser, getActivityEndTime } from './activity-timeline';

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

// Activity icons mapping
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

interface ScrollableActivityTimelineProps {
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

/**
 * Format time interval between activities (e.g., "1h 30min")
 */
function formatInterval(minutes: number): string {
  if (minutes >= 60) {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (mins === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${mins}min`;
  }
  return `${minutes}min`;
}

export function ScrollableActivityTimeline({
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
}: ScrollableActivityTimelineProps) {
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

  // Get last N activities, sorted by time (oldest first), grouped by 5-minute windows
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
      .slice(0, activityCount * 2) // Take more than needed to account for grouping
      .reverse(); // Reverse to show oldest to newest (left to right)

    // Group activities within 5 minutes of each other
    // Keep the first activity in each group (oldest)
    const grouped: ActivityWithUser[] = [];
    const GROUPING_WINDOW_MINUTES = 5;

    for (const activity of filtered) {
      if (grouped.length === 0) {
        // First activity, always add it
        grouped.push(activity);
        continue;
      }

      const lastGroupedActivity = grouped.at(-1);
      if (!lastGroupedActivity) continue;
      const lastActivityEndTime = getActivityEndTime(lastGroupedActivity);
      const currentActivityStartTime = new Date(activity.startTime);

      // Check if this activity is within 5 minutes of the last grouped activity
      const minutesBetween = differenceInMinutes(
        currentActivityStartTime,
        lastActivityEndTime,
      );

      if (minutesBetween <= GROUPING_WINDOW_MINUTES) {
        // Within 5 minutes, skip this activity (already have one in the group)
        continue;
      }

      // More than 5 minutes apart, add this activity
      grouped.push(activity);

      // Stop if we have enough activities
      if (grouped.length >= activityCount) {
        break;
      }
    }

    return grouped;
  }, [timelineActivities, activityTypes, activityCount]);

  const includeNowIcon = showNowIcon && recentActivitiesList.length > 0;
  // Timeline items include a trailing null placeholder when showing the "now" icon
  const timelineItems = includeNowIcon
    ? [...recentActivitiesList, null]
    : [...recentActivitiesList];

  // Ref for scroll container to scroll to the right on mount
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Scroll to the rightmost position when timeline items change
  useEffect(() => {
    if (scrollContainerRef.current && timelineItems.length > 0) {
      // Scroll to the rightmost position to show the "Now" icon
      scrollContainerRef.current.scrollLeft =
        scrollContainerRef.current.scrollWidth -
        scrollContainerRef.current.clientWidth;
    }
  }, [timelineItems.length]);

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

  const defaultIconColor = iconColorClass || 'text-foreground';
  const defaultLineColor = lineColorClass || 'bg-muted';

  // Each segment is 25% of the scroll container width to show 4 activities at once
  // The inner container width will be timelineItems.length * 25% to accommodate all items
  const segmentWidth = '25%';
  const totalWidthPercent = timelineItems.length * 25;

  return (
    <div className={cn('space-y-3 -mx-6', className)}>
      {/* Horizontal scroll container wrapping the timeline */}
      <div
        className="overflow-x-auto overflow-y-visible pb-4 snap-x snap-mandatory scrollbar-hide"
        ref={scrollContainerRef}
        style={{ paddingBottom: '2.5rem', paddingTop: '2rem' }}
      >
        <div className="inline-flex" style={{ width: `${totalWidthPercent}%` }}>
          {/* Timeline track */}
          <div className="relative px-6 w-full">
            {/* Timeline with segments between icons using flex */}
            <div className="flex items-center h-1">
              {timelineItems.map((item, index) => {
                const isNowIconItem = item === null;
                const isLast = index === timelineItems.length - 1;

                if (isNowIconItem) {
                  return (
                    <div
                      className="relative flex items-center shrink-0 snap-center"
                      key="now-icon"
                      style={{ width: segmentWidth }}
                    >
                      <div className="relative shrink-0 z-10">
                        <Clock className={cn('size-5', defaultIconColor)} />
                      </div>
                      {/* "Now" label - positioned absolutely at bottom, same reference as other labels */}
                      <div className="absolute top-6 left-0 z-20 flex flex-col gap-0.5 items-start">
                        <span className="text-xs font-medium text-foreground leading-tight whitespace-nowrap">
                          {formatTimeWithPreference(new Date(), timeFormat)}
                        </span>
                        <span className="text-xs text-muted-foreground leading-tight whitespace-nowrap">
                          Now
                        </span>
                      </div>
                    </div>
                  );
                }

                const activity = item;
                const ActivityIcon = (activityIcons[activity.type] ??
                  activityIcons.activity) as React.ComponentType<{
                  className?: string;
                }>;

                // Get user info for avatar
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
                const nextItem = !isLast ? timelineItems[index + 1] : null;
                const nextActivity =
                  nextItem && nextItem !== null ? nextItem : null;
                const previousActivity = activity;
                const isNextItemNowIcon = nextItem === null && includeNowIcon;

                // Calculate interval minutes
                const intervalMinutes = nextActivity
                  ? differenceInMinutes(
                      new Date(nextActivity.startTime),
                      getActivityEndTime(activity),
                    )
                  : isNextItemNowIcon
                    ? differenceInMinutes(
                        new Date(),
                        getActivityEndTime(activity),
                      )
                    : null;

                // Get activity time and details for label
                const activityTime = new Date(activity.startTime);
                const exactTime = formatTimeWithPreference(
                  activityTime,
                  timeFormat,
                );
                const activityDetails = showActivityDetails
                  ? formatActivityDetails(activity, userUnitPref)
                  : null;

                const TimeDisplay = onActivityClick ? 'button' : 'div';

                return (
                  <div
                    className="relative flex items-center shrink-0 snap-center"
                    key={activity.id}
                    style={{ width: segmentWidth }}
                  >
                    {/* Avatar - positioned absolutely at top */}
                    <div className="absolute -top-6 left-0 z-20">
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

                    {/* Icon container */}
                    <div className="relative shrink-0 z-10">
                      {onActivityClick ? (
                        <button
                          className="relative flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                          onClick={() => onActivityClick(activity)}
                          type="button"
                        >
                          <ActivityIcon
                            className={cn('size-5', defaultIconColor)}
                          />
                        </button>
                      ) : (
                        <div className="relative flex flex-col items-center">
                          <ActivityIcon
                            className={cn('size-5', defaultIconColor)}
                          />
                        </div>
                      )}
                    </div>

                    {/* Label - positioned absolutely at bottom, same reference as avatar */}
                    <TimeDisplay
                      className={cn(
                        'absolute top-6 left-0 z-20 flex flex-col gap-0.5 items-start',
                        onActivityClick &&
                          'cursor-pointer hover:opacity-80 transition-opacity',
                      )}
                      onClick={
                        onActivityClick
                          ? () => onActivityClick(activity)
                          : undefined
                      }
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

                    {/* Line segment after icon (show if there's a next item) */}
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
                          {/* Visual line segment */}
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
        </div>
      </div>

      {/* Add custom scrollbar styles */}
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
        .scrollbar-hide {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
      `}</style>
    </div>
  );
}
