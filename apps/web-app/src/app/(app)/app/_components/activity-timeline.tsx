'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Icons } from '@nugget/ui/custom/icons';
import {
  differenceInMinutes,
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Baby,
  Bath,
  Droplet,
  Droplets,
  Milk,
  Moon,
  Pill,
  Scale,
  Thermometer,
  Timer,
  Tablet as Toilet,
  UtensilsCrossed,
} from 'lucide-react';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { ActivityDrawer } from '~/app/(app)/app/_components/activity-drawer';
import { ActivityTimelineFilters } from '~/app/(app)/app/_components/activity-timeline-filters';
import { getActivitiesAction } from './activity-timeline.actions';
import { getDisplayNotes } from './activity-utils';
import { formatVolumeDisplay, getVolumeUnit } from './volume-utils';

const activities = [
  {
    color: 'bg-[oklch(0.75_0.15_195)]',
    icon: Moon,
    id: 'sleep',
    label: 'Sleep',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    icon: Droplet,
    id: 'nursing',
    label: 'Nursing',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    icon: Milk,
    id: 'bottle',
    label: 'Bottle',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.72_0.16_330)]',
    icon: UtensilsCrossed,
    id: 'solids',
    label: 'Solids',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    icon: Baby,
    id: 'diaper',
    label: 'Diaper',
    textColor: 'text-[oklch(0.18_0.02_60)]',
  },
  {
    color: 'bg-[oklch(0.65_0.18_280)]',
    icon: Droplets,
    id: 'pumping',
    label: 'Pumping',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    icon: Toilet,
    id: 'potty',
    label: 'Potty',
    textColor: 'text-[oklch(0.18_0.02_60)]',
  },
  {
    color: 'bg-[oklch(0.70_0.16_150)]',
    icon: Activity,
    id: 'activity',
    label: 'Activity',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.70_0.16_150)]',
    icon: Timer,
    id: 'tummy-time',
    label: 'Tummy Time',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_10)]',
    icon: Pill,
    id: 'medicine',
    label: 'Medicine',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_10)]',
    icon: Thermometer,
    id: 'temperature',
    label: 'Temperature',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    icon: Scale,
    id: 'growth',
    label: 'Growth',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    icon: Bath,
    id: 'bath',
    label: 'Bath',
    textColor: 'text-white',
  },
] satisfies Array<{
  color: string;
  icon: LucideIcon;
  id: string;
  label: string;
  textColor: string;
}>;

interface ActivityTimelineProps {
  optimisticActivities?: Array<typeof Activities.$inferSelect>;
  refreshTrigger?: number;
}

const activityIcons: Record<string, typeof Moon> = {
  activity: Activity,
  bath: Bath,
  bottle: Milk,
  diaper: Baby,
  growth: Scale,
  medicine: Pill,
  nursing: Droplet,
  potty: Toilet,
  pumping: Droplets,
  sleep: Moon,
  solids: UtensilsCrossed,
  temperature: Thermometer,
  'tummy-time': Timer,
};

const activityColors: Record<string, string> = {
  activity: 'border-l-[oklch(0.70_0.16_150)]',
  bath: 'border-l-[oklch(0.62_0.18_260)]',
  bottle: 'border-l-[oklch(0.68_0.18_35)]',
  diaper: 'border-l-[oklch(0.78_0.14_60)]',
  growth: 'border-l-[oklch(0.62_0.18_260)]',
  medicine: 'border-l-[oklch(0.68_0.18_10)]',
  nursing: 'border-l-[oklch(0.68_0.18_35)]',
  potty: 'border-l-[oklch(0.78_0.14_60)]',
  pumping: 'border-l-[oklch(0.65_0.18_280)]',
  sleep: 'border-l-[oklch(0.75_0.15_195)]',
  solids: 'border-l-[oklch(0.72_0.16_330)]',
  temperature: 'border-l-[oklch(0.68_0.18_10)]',
  'tummy-time': 'border-l-[oklch(0.70_0.16_150)]',
};

const activityIconColors: Record<string, string> = {
  activity: 'text-[oklch(0.70_0.16_150)]',
  bath: 'text-[oklch(0.62_0.18_260)]',
  bottle: 'text-[oklch(0.68_0.18_35)]',
  diaper: 'text-[oklch(0.78_0.14_60)]',
  growth: 'text-[oklch(0.62_0.18_260)]',
  medicine: 'text-[oklch(0.68_0.18_10)]',
  nursing: 'text-[oklch(0.68_0.18_35)]',
  potty: 'text-[oklch(0.78_0.14_60)]',
  pumping: 'text-[oklch(0.65_0.18_280)]',
  sleep: 'text-[oklch(0.75_0.15_195)]',
  solids: 'text-[oklch(0.72_0.16_330)]',
  temperature: 'text-[oklch(0.68_0.18_10)]',
  'tummy-time': 'text-[oklch(0.70_0.16_150)]',
};

function groupActivitiesByDay(
  activities: Array<typeof Activities.$inferSelect>,
): Map<string, Array<typeof Activities.$inferSelect>> {
  const grouped = new Map<string, Array<typeof Activities.$inferSelect>>();

  for (const activity of activities) {
    const activityDate = new Date(activity.startTime);
    let dayLabel: string;

    if (isToday(activityDate)) {
      dayLabel = 'Today';
    } else if (isYesterday(activityDate)) {
      dayLabel = 'Yesterday';
    } else {
      dayLabel = format(activityDate, 'EEEE, MMMM d');
    }

    if (!grouped.has(dayLabel)) {
      grouped.set(dayLabel, []);
    }
    grouped.get(dayLabel)?.push(activity);
  }

  return grouped;
}

function formatTimeGap(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

export function ActivityTimeline({
  optimisticActivities = [],
  refreshTrigger = 0,
}: ActivityTimelineProps) {
  const [activitiesData, setActivitiesData] = useState<
    Array<typeof Activities.$inferSelect>
  >([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(
    [],
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Fetch user preferences for volume display
  const { data: user } = api.user.current.useQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');

  const loadActivities = useCallback(
    async (offset = 0, append = false, skipAnimation = false) => {
      try {
        if (offset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const result = await getActivitiesAction({
          activityTypes:
            selectedActivityTypes.length > 0
              ? selectedActivityTypes
              : undefined,
          limit: 30,
          offset,
          userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
        });

        if (result?.data) {
          const { activities: newActivities, hasMore: more } = result.data;
          if (append) {
            setActivitiesData((prev) => [...prev, ...newActivities]);
          } else {
            setActivitiesData(newActivities);
          }
          setHasMore(more);
          // Disable animations after initial load if skipAnimation is true
          if (skipAnimation && isInitialLoad) {
            setIsInitialLoad(false);
          }
        } else if (result?.serverError) {
          setError(result.serverError);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load activities',
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedUserIds, selectedActivityTypes, isInitialLoad],
  );

  // Initial load
  useEffect(() => {
    loadActivities(0, false, false);
    // Mark as no longer initial load after first load
    setIsInitialLoad(false);
  }, [loadActivities]);

  // Refetch data when refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadActivities(0, false, true);
    }
  }, [refreshTrigger, loadActivities]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && hasMore) {
          loadActivities(activitiesData.length, true, true);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [activitiesData.length, hasMore, loadActivities, loadingMore]);

  const handleActivityClick = (activity: typeof Activities.$inferSelect) => {
    setEditingActivity(activity);
    setOpenDrawer(activity.type);
  };

  const handleDrawerClose = () => {
    setOpenDrawer(null);
    setEditingActivity(null);
  };

  const handleActivityUpdated = (
    updatedActivity: typeof Activities.$inferSelect,
  ) => {
    // Optimistically update the local state
    setActivitiesData((prev) => {
      const existingIndex = prev.findIndex((a) => a.id === updatedActivity.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = updatedActivity;
        return updated;
      }
      return prev;
    });
  };

  const handleActivitySaved = () => {
    // Reload data from server after successful save (skip animations)
    loadActivities(0, false, true);
  };

  const handleFilterChange = (userIds: string[], activityTypes: string[]) => {
    setSelectedUserIds(userIds);
    setSelectedActivityTypes(activityTypes);
    // Reload activities from the beginning (with animation since it's a user action)
    loadActivities(0, false, false);
  };

  // Merge optimistic activities with fetched activities
  // Optimistic activities override fetched activities with the same ID
  const allActivities = React.useMemo(() => {
    const optimisticIds = new Set(optimisticActivities.map((a) => a.id));
    const mergedActivities = [
      ...optimisticActivities,
      ...activitiesData.filter((a) => !optimisticIds.has(a.id)),
    ];
    return mergedActivities.sort(
      (a, b) =>
        new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
    );
  }, [optimisticActivities, activitiesData]);

  const groupedActivities = groupActivitiesByDay(allActivities);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div className="h-20 bg-muted/30 rounded-xl animate-pulse" key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (activitiesData.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-muted/30 p-4 mb-4">
          <Baby className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No activities yet</h3>
        <p className="text-sm text-muted-foreground text-center">
          Start tracking by tapping a quick action button above
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {Array.from(groupedActivities.entries()).map(
        ([dayLabel, dayActivities], groupIndex) => (
          <div
            className={isInitialLoad ? 'animate-in fade-in duration-300' : ''}
            key={dayLabel}
          >
            <div className="sticky top-18 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                {dayLabel}
              </h3>
              {groupIndex === 0 && (
                <ActivityTimelineFilters
                  activityTypes={activities}
                  onFilterChange={handleFilterChange}
                  selectedActivityTypes={selectedActivityTypes}
                  selectedUserIds={selectedUserIds}
                />
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              {dayActivities.map((activity, index) => {
                const Icon = activityIcons[activity.type] || Baby;
                const colorClass =
                  activityColors[activity.type] || 'border-l-primary';
                const iconColorClass =
                  activityIconColors[activity.type] || 'text-primary';
                const activityDate = new Date(activity.startTime);
                const absoluteTime = format(activityDate, 'h:mm a');
                const relativeTime = formatDistanceToNow(activityDate, {
                  addSuffix: true,
                });
                const isOptimistic = activity.id.startsWith(
                  'activity-optimistic',
                );

                // Build activity details string
                const details: string[] = [];
                if (activity.duration) {
                  details.push(`${activity.duration} min`);
                }
                if (activity.amount) {
                  details.push(
                    formatVolumeDisplay(activity.amount, userUnitPref, true),
                  );
                }

                // Add diaper type details
                if (activity.type === 'diaper' && activity.details) {
                  const diaperDetails = activity.details as {
                    type?: string;
                    wet?: boolean;
                    dirty?: boolean;
                  };
                  if (diaperDetails.type === 'wet') {
                    details.push('Pee');
                  } else if (diaperDetails.type === 'dirty') {
                    details.push('Poop');
                  } else if (diaperDetails.type === 'both') {
                    details.push('Both');
                  } else if (diaperDetails.wet && diaperDetails.dirty) {
                    details.push('Both');
                  } else if (diaperDetails.wet) {
                    details.push('Pee');
                  } else if (diaperDetails.dirty) {
                    details.push('Poop');
                  }
                }

                const detailsText =
                  details.length > 0 ? ` / ${details.join(', ')}` : '';

                // Calculate time gap from previous activity
                const previousActivity =
                  index > 0 ? dayActivities[index - 1] : null;
                const timeGapMinutes = previousActivity
                  ? differenceInMinutes(
                      new Date(previousActivity.startTime),
                      activityDate,
                    )
                  : 0;
                const showTimeGap = timeGapMinutes >= 15;

                return (
                  <div key={activity.id}>
                    {showTimeGap && (
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-px bg-border/50 flex-1" />
                        <span className="text-xs text-muted-foreground/60 font-medium">
                          {formatTimeGap(timeGapMinutes)}
                        </span>
                        <div className="h-px bg-border/50 flex-1" />
                      </div>
                    )}
                    <button
                      className={`flex items-start gap-3 p-3.5 rounded-xl bg-card/50 border-l-4 ${colorClass} ${
                        isOptimistic
                          ? 'opacity-100 animate-pulse cursor-not-allowed'
                          : 'opacity-60 hover:opacity-90 cursor-pointer'
                      } transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${isInitialLoad ? 'animate-in slide-in-from-bottom-2' : ''} w-full text-left`}
                      disabled={isOptimistic}
                      onClick={() =>
                        !isOptimistic && handleActivityClick(activity)
                      }
                      style={
                        isInitialLoad
                          ? {
                              animationDelay: `${index * 30}ms`,
                              animationFillMode: 'backwards',
                            }
                          : undefined
                      }
                      type="button"
                    >
                      <div
                        className={`shrink-0 p-2 rounded-lg ${isOptimistic ? 'bg-primary/20' : 'bg-muted/40'}`}
                      >
                        {isOptimistic ? (
                          <Icons.Spinner className="size-4 text-primary" />
                        ) : (
                          <Icon className={`size-4 ${iconColorClass}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <h4
                              className={`text-sm font-medium capitalize ${isOptimistic ? 'text-foreground' : ''}`}
                            >
                              {activity.type.replace('-', ' ')}
                              {detailsText && (
                                <span className="text-muted-foreground font-normal">
                                  {detailsText}
                                </span>
                              )}
                            </h4>
                          </div>
                          <div className="flex flex-col items-end gap-0.5 shrink-0">
                            <span className="text-xs text-muted-foreground whitespace-nowrap">
                              {isOptimistic ? 'Just now' : relativeTime}
                            </span>
                            <span className="text-xs text-muted-foreground/70 font-mono whitespace-nowrap">
                              {absoluteTime}
                            </span>
                          </div>
                        </div>
                        {getDisplayNotes(activity.notes) && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {getDisplayNotes(activity.notes)}
                          </p>
                        )}
                        {isOptimistic && (
                          <p className="text-xs text-primary mt-1">Saving...</p>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      )}

      {hasMore && (
        <div className="flex justify-center py-6" ref={loadMoreRef}>
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icons.Spinner className="size-5" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && activitiesData.length > 0 && (
        <div className="flex justify-center py-6">
          <p className="text-xs text-muted-foreground">
            That's all your activities from the past week
          </p>
        </div>
      )}

      {/* Activity Drawers */}
      {activities.map((activityType) => (
        <ActivityDrawer
          activity={activityType}
          existingActivity={
            openDrawer === activityType.id ? editingActivity : null
          }
          isOpen={openDrawer === activityType.id}
          key={activityType.id}
          onActivitySaved={handleActivitySaved}
          onActivityUpdated={handleActivityUpdated}
          onClose={handleDrawerClose}
        />
      ))}
    </div>
  );
}
