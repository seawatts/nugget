'use client';

import {
  buildDashboardEvent,
  DASHBOARD_ACTION,
  DASHBOARD_COMPONENT,
} from '@nugget/analytics/utils';
import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { toast } from '@nugget/ui/sonner';
import { startOfDay, subDays } from 'date-fns';
import { Clock, Moon, StopCircle, Timer } from 'lucide-react';
import { useParams } from 'next/navigation';
import posthog from 'posthog-js';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import {
  getUserRelationFromStore,
  useOptimisticActivitiesStore,
} from '~/stores/optimistic-activities';
import { getActivityTheme } from '../shared/activity-theme-config';
import {
  PredictiveCardHeader,
  PredictiveCardSkeleton,
  PredictiveInfoDrawer,
} from '../shared/components/predictive-cards';
import { PredictiveProgressTrack } from '../shared/components/predictive-progress-track';
import { TimelineDrawerWrapper } from '../shared/components/timeline-drawer-wrapper';
import { getSleepDailyProgress } from '../shared/daily-progress';
import { formatMinutesToHoursMinutes } from '../shared/time-formatting-utils';
import {
  formatCompactRelativeTime,
  formatCompactRelativeTimeWithAgo,
} from '../shared/utils/format-compact-relative-time';
import { useActivityMutations } from '../use-activity-mutations';
import { quickLogSleepAction } from './actions';
import { SleepStatsDrawer } from './components';
import { getSleepLearningContent } from './learning-content';
import { predictNextSleep } from './prediction';
import { getDailyNapGoal, getDailySleepHoursGoal } from './sleep-goals';
import {
  calculateTimelineWindow,
  checkCollision,
  findAvailableTimeSlots,
} from './timeline-entry/utils/timeline-calculations';
import { TimelineSleepDrawer } from './timeline-sleep-drawer';

interface QuickActionSleepCardProps {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  onOpenDrawer?: () => void;
}

export function QuickActionSleepCard({
  onActivityLogged,
  onOpenDrawer,
}: QuickActionSleepCardProps) {
  const params = useParams();
  const babyId = params.babyId as string;

  // Get shared data from dashboard store (populated by DashboardContainer)
  const userData = useDashboardDataStore.use.user();
  const allActivities = useDashboardDataStore.use.activities();
  const baby = useDashboardDataStore.use.baby();

  const timeFormat = userData?.timeFormat || '12h';

  // Get optimistic activities from store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  const mergedActivities = useMemo(() => {
    const map = new Map<string, typeof Activities.$inferSelect>();
    (allActivities ?? []).forEach((activity) => {
      map.set(activity.id, activity);
    });
    optimisticActivities.forEach((activity) => {
      map.set(activity.id, activity);
    });
    return Array.from(map.values());
  }, [allActivities, optimisticActivities]);

  // Use tRPC query for prediction data
  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = api.activities.getUpcomingSleep.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);

  // Fetch extended activities for stats drawer (90 days, only when drawer opens)
  const ninetyDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 90)), []);
  const { data: extendedActivities = [] } = api.activities.list.useQuery(
    {
      babyId,
      limit: 500,
      since: ninetyDaysAgo,
    },
    {
      enabled: Boolean(babyId) && showStatsDrawer,
      staleTime: 60000,
    },
  );

  const [creatingType, setCreatingType] = useState<
    'lastActivity' | 'timer' | null
  >(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // Query for in-progress sleep activity
  const { data: inProgressActivity } =
    api.activities.getInProgressActivity.useQuery(
      {
        activityType: 'sleep',
        babyId: babyId ?? '',
      },
      { enabled: Boolean(babyId), refetchInterval: 5000 },
    );

  const { createActivity, updateActivity } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );
  const removeOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.removeActivity,
  );
  const utils = api.useUtils();

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        babyBirthDate: queryData.babyBirthDate,
        prediction: predictNextSleep(
          [...optimisticActivities, ...queryData.recentActivities],
          queryData.babyBirthDate,
        ),
        recentActivities: queryData.recentActivities,
      }
    : null;

  const babyAgeDays = data?.babyAgeDays ?? null;

  const activitiesForProgress = useMemo(() => {
    if (inProgressActivity) {
      return [...mergedActivities, inProgressActivity];
    }
    return mergedActivities;
  }, [inProgressActivity, mergedActivities]);

  const sleepProgress = useMemo(
    () =>
      getSleepDailyProgress({
        activities: activitiesForProgress,
        babyAgeDays,
      }),
    [activitiesForProgress, babyAgeDays],
  );

  const formatSleepGoalLabel = (minutes: number | null | undefined) => {
    if (!minutes || minutes <= 0) return null;
    if (minutes >= 60) {
      const hours = minutes / 60;
      const displayHours = Number.isInteger(hours)
        ? hours
        : Number(hours.toFixed(1));
      return `${displayHours}h`;
    }
    return `${minutes}m`;
  };

  const sleepStartLabel =
    typeof sleepProgress?.currentValue === 'number'
      ? `${formatSleepGoalLabel(sleepProgress.currentValue) ?? '0h'} Today`
      : typeof sleepProgress?.goalValue === 'number'
        ? '0h Today'
        : null;
  const sleepEndLabel =
    typeof sleepProgress?.goalValue === 'number'
      ? `Goal ${formatSleepGoalLabel(sleepProgress.goalValue)}`
      : null;

  // Find the most recent sleep activity with user info
  const lastSleepActivity = useMemo(() => {
    if (!queryData?.recentActivities) return null;

    return queryData.recentActivities.find(
      (a) =>
        a.type === 'sleep' &&
        !a.isScheduled &&
        a.endTime !== null && // Only show completed activities
        a.duration &&
        a.duration > 0, // Must have duration
    );
  }, [queryData?.recentActivities]);

  // Get user info from last sleep
  const lastSleepUser = lastSleepActivity?.user
    ? {
        avatar: lastSleepActivity.user.avatarUrl,
        initials: (
          lastSleepActivity.user.firstName?.[0] ||
          lastSleepActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [lastSleepActivity.user.firstName, lastSleepActivity.user.lastName]
            .filter(Boolean)
            .join(' ') || lastSleepActivity.user.email,
      }
    : null;

  const error = queryError?.message || null;

  // Timer effect - updates elapsed time every second when tracking
  useEffect(() => {
    if (inProgressActivity) {
      // Calculate initial elapsed time
      const elapsed = Math.floor(
        (Date.now() - new Date(inProgressActivity.startTime).getTime()) / 1000,
      );
      setElapsedTime(elapsed);

      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(inProgressActivity.startTime).getTime()) /
            1000,
        );
        setElapsedTime(elapsed);
      }, 1000);
    } else {
      setElapsedTime(0);
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }

    return () => {
      if (timerRef.current) {
        clearInterval(timerRef.current);
      }
    };
  }, [inProgressActivity]);

  // Calculate last activity sleep duration and timing
  // This must be before conditional returns to follow React hooks rules
  const lastActivitySleep = useMemo(() => {
    const now = new Date();

    // Find the last activity (any type) from mergedActivities
    // Sort by endTime if available, otherwise startTime, most recent first
    const sortedActivities = [...mergedActivities]
      .filter((a) => !a.isScheduled)
      .sort((a, b) => {
        const aTime = a.endTime
          ? new Date(a.endTime).getTime()
          : new Date(a.startTime).getTime();
        const bTime = b.endTime
          ? new Date(b.endTime).getTime()
          : new Date(b.startTime).getTime();
        return bTime - aTime; // Most recent first
      });

    if (sortedActivities.length === 0) {
      return null;
    }

    const lastActivity = sortedActivities[0];
    if (!lastActivity) return null;
    // Use endTime if available, otherwise startTime
    const lastActivityTime = lastActivity.endTime
      ? new Date(lastActivity.endTime)
      : new Date(lastActivity.startTime);

    // Calculate initial duration from last activity to now
    const initialDurationMinutes = Math.floor(
      (now.getTime() - lastActivityTime.getTime()) / (1000 * 60),
    );

    // Clamp duration to reasonable bounds (10 minutes to 8 hours)
    const minDuration = 10;
    const maxDuration = 480; // 8 hours
    let durationMinutes = Math.max(
      minDuration,
      Math.min(maxDuration, initialDurationMinutes),
    );

    // Calculate start time (duration minutes before now)
    let startTime = new Date(now.getTime() - durationMinutes * 60 * 1000);
    let endTime = now;

    // Check for conflicts with existing sleep activities
    const sleepActivities = mergedActivities.filter(
      (a) => a.type === 'sleep' && !a.isScheduled,
    );

    // Create a timeline window that includes both startTime and now
    // Center on the midpoint between startTime and now
    const midpoint = new Date((startTime.getTime() + now.getTime()) / 2);
    const timelineWindow = calculateTimelineWindow(midpoint);

    // Check if there's a conflict
    const hasConflict = checkCollision(
      startTime,
      endTime,
      sleepActivities,
      timelineWindow,
    );

    // If conflict exists, find the next available gap
    if (hasConflict) {
      const availableSlots = findAvailableTimeSlots(
        sleepActivities,
        timelineWindow,
        10, // Minimum 10 minutes
      );

      // Find the first slot that ends at or before now
      const suitableSlot = availableSlots.find(
        (slot: { endTime: Date; startTime: Date }) =>
          new Date(slot.endTime).getTime() <= now.getTime(),
      );

      if (suitableSlot) {
        startTime = new Date(suitableSlot.startTime);
        endTime = new Date(suitableSlot.endTime);
        durationMinutes = Math.floor(
          (endTime.getTime() - startTime.getTime()) / (1000 * 60),
        );
      } else {
        // No suitable slot found, return null to disable button
        return null;
      }
    }

    // Get activity theme for icon and label
    const activityTheme = getActivityTheme(
      lastActivity.type as Parameters<typeof getActivityTheme>[0],
    );
    const ActivityIcon = activityTheme.icon;

    return {
      activity: {
        icon: ActivityIcon,
        label: activityTheme.label,
        time: lastActivityTime,
        type: lastActivity.type,
      },
      duration: durationMinutes,
      endTime,
      startTime,
    };
  }, [mergedActivities]);

  const handleLastActivitySleep = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!lastActivitySleep) {
      toast.error('No recent activity found');
      return;
    }

    // Track quick action click
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.ACTIVITY_CARDS,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      {
        action_type: 'last_activity',
        activity_type: 'sleep',
        baby_id: babyId,
      },
    );

    setCreatingType('lastActivity');

    let tempId: string | null = null;

    try {
      const { duration, endTime, startTime } = lastActivitySleep;

      // Determine sleep type based on time of day
      const hour = startTime.getHours();
      const sleepType = hour >= 6 && hour < 18 ? 'nap' : 'night';

      // Create optimistic activity for immediate UI feedback
      const userRelation = getUserRelationFromStore();
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: endTime,
        details: {
          sleepType,
          type: 'sleep' as const,
        },
        duration,
        endTime: endTime,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `activity-optimistic-sleep-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: startTime,
        subjectType: 'baby' as const,
        type: 'sleep' as const,
        updatedAt: endTime,
        user: userRelation,
        userId: userRelation?.id || 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity using the server action
      const result = await quickLogSleepAction({
        babyId,
        duration,
        time: endTime.toISOString(),
      });

      if (!result?.data?.activity) {
        throw new Error('Failed to create activity');
      }

      onActivityLogged?.(result.data.activity);

      // Invalidate and await refetch to ensure UI updates with new data
      await utils.activities.getUpcomingSleep.invalidate();

      // Remove optimistic activity after query has refetched
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
    } catch (err) {
      console.error('Failed to log last activity sleep:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log sleep. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleStartTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // If already tracking, stop the timer
    if (inProgressActivity) {
      handleStopTimer(e);
      return;
    }

    // Track quick action click
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.ACTIVITY_CARDS,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      {
        action_type: 'timer_start',
        activity_type: 'sleep',
        baby_id: babyId,
      },
    );

    setCreatingType('timer');

    let tempId: string | null = null;

    try {
      const now = new Date();

      // Determine sleep type based on time of day
      const hour = now.getHours();
      const sleepType = hour >= 6 && hour < 18 ? 'nap' : 'night';

      // Create optimistic activity for immediate UI feedback
      const userRelation = getUserRelationFromStore();
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: {
          sleepType,
          type: 'sleep' as const,
        },
        duration: 0,
        endTime: null, // No end time = in progress
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `activity-optimistic-sleep-timer-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        type: 'sleep' as const,
        updatedAt: now,
        user: userRelation,
        userId: userRelation?.id || 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual in-progress activity (no endTime)
      const activity = await createActivity({
        activityType: 'sleep',
        babyId,
        details: {
          sleepType,
          type: 'sleep',
        },
        startTime: now,
        // No duration or endTime - this marks it as in-progress
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      toast.success('Sleep timer started');
      // Don't await - let it invalidate in background
      utils.activities.getUpcomingSleep.invalidate();
    } catch (err) {
      console.error('Failed to start sleep timer:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to start timer. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleStopTimer = async (e: React.MouseEvent) => {
    e.stopPropagation();

    if (!inProgressActivity) return;

    // Track quick action click
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.ACTIVITY_CARDS,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      {
        action_type: 'timer_stop',
        activity_type: 'sleep',
        baby_id: babyId,
      },
    );

    setCreatingType('timer');

    const now = new Date();
    const startTime = new Date(inProgressActivity.startTime);
    const elapsedMinutes = (now.getTime() - startTime.getTime()) / (1000 * 60);
    const durationMinutes = Math.max(1, Math.ceil(elapsedMinutes));

    // Create optimistic completed activity for immediate UI feedback
    const completedActivity = {
      ...inProgressActivity,
      duration: durationMinutes,
      endTime: now,
      updatedAt: now,
    };

    // Update optimistic store immediately
    removeOptimisticActivity(inProgressActivity.id);
    const tempId = addOptimisticActivity(completedActivity);

    // Clear loading state immediately for better UX
    setCreatingType(null);

    try {
      // Update in background - don't await
      updateActivity({
        duration: durationMinutes,
        endTime: now,
        id: inProgressActivity.id,
      })
        .then((activity) => {
          // Remove optimistic activity after real one is saved
          if (tempId) {
            removeOptimisticActivity(tempId);
          }
          onActivityLogged?.(activity);
          // Invalidate queries in background
          utils.activities.getUpcomingSleep.invalidate();
          utils.activities.getInProgressActivity.invalidate();
        })
        .catch((err) => {
          console.error('Failed to stop sleep timer:', err);
          // Remove optimistic activity on error
          if (tempId) {
            removeOptimisticActivity(tempId);
          }
          toast.error('Failed to stop timer. Please try again.');
        });

      // Show success toast immediately
      toast.success('Sleep tracking stopped');
    } catch (err) {
      // This shouldn't happen since we're not awaiting, but keep for safety
      console.error('Failed to stop sleep timer:', err);
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to stop timer. Please try again.');
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDrawer(true);
  };

  const handleStatsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Track stats drawer open
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.SLEEP_STATS_DRAWER,
        DASHBOARD_ACTION.DRAWER_OPEN,
      ),
      {
        baby_id: babyId,
        source: 'quick_action_card',
      },
    );
    setShowStatsDrawer(true);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    // Track drawer open
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.ACTIVITY_CARDS,
        DASHBOARD_ACTION.DRAWER_OPEN,
      ),
      {
        activity_type: 'sleep',
        baby_id: babyId,
        source: 'quick_action_card',
      },
    );
    onOpenDrawer?.();
  };

  const handleLastActivityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lastSleepActivity) {
      setEditingActivity(lastSleepActivity);
      setEditDrawerOpen(true);
    }
  };

  const handleEditDrawerClose = () => {
    setEditDrawerOpen(false);
    setEditingActivity(null);
  };

  // Conditional returns must come after all hooks
  if (error) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 bg-destructive/10 col-span-2',
        )}
      >
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (isLoading && !data) {
    return <PredictiveCardSkeleton activityType="sleep" />;
  }

  if (!data) return null;

  const { prediction } = data;

  // Format time displays
  const nextTimeDistance = formatCompactRelativeTime(prediction.nextSleepTime, {
    addSuffix: false,
  });
  const nextExactTime = formatTimeWithPreference(
    prediction.nextSleepTime,
    timeFormat,
  );

  const lastTimeDistance = prediction.lastSleepTime
    ? formatCompactRelativeTimeWithAgo(prediction.lastSleepTime)
    : null;
  const lastExactTime = prediction.lastSleepTime
    ? formatTimeWithPreference(prediction.lastSleepTime, timeFormat)
    : null;

  // Format duration for display
  const formatDuration = (minutes: number | null) => {
    if (!minutes) return null;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0 && mins > 0) {
      return `${hours}h ${mins}m`;
    }
    if (hours > 0) {
      return `${hours}h`;
    }
    return `${mins}m`;
  };

  // Format elapsed time for timer display
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const sleepTheme = getActivityTheme('sleep');
  const SleepIcon = sleepTheme.icon;
  const currentSleepStartTime = inProgressActivity
    ? formatTimeWithPreference(
        new Date(inProgressActivity.startTime),
        timeFormat,
      )
    : null;

  // Calculate today's sleep statistics for goal display (for stats drawer)
  // const todaysStats = calculateTodaysSleepStats(todaysActivitiesData ?? []);
  // const dailyNapGoal = getDailyNapGoal(
  //   babyAgeDays ?? 0,
  //   prediction.averageIntervalHours,
  //   prediction.calculationDetails.dataPoints,
  // );
  // const dailySleepHoursGoal = getDailySleepHoursGoal(babyAgeDays ?? 0);
  const dailyNapGoal =
    typeof babyAgeDays === 'number'
      ? getDailyNapGoal(
          babyAgeDays,
          prediction.averageIntervalHours,
          prediction.calculationDetails.dataPoints,
        )
      : null;

  const dailySleepHoursGoal =
    typeof babyAgeDays === 'number'
      ? getDailySleepHoursGoal(babyAgeDays)
      : null;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 border-0 col-span-2',
          `bg-${sleepTheme.color} ${sleepTheme.textColor}`,
        )}
      >
        <div className="flex flex-col gap-4">
          <PredictiveCardHeader
            icon={SleepIcon}
            isFetching={isFetching && !isLoading}
            onAddClick={handleAddClick}
            onInfoClick={handleInfoClick}
            onStatsClick={handleStatsClick}
            quickLogEnabled={false}
            showAddIcon={true}
            showStatsIcon={userData?.showActivityGoals ?? true}
            title="Sleep"
          />

          <PredictiveProgressTrack
            endLabel={sleepEndLabel ?? undefined}
            progressPercent={sleepProgress?.percentage}
            srLabel={sleepProgress?.srLabel}
            startLabel={sleepStartLabel ?? undefined}
          />

          <div className="flex items-start justify-between px-2">
            {inProgressActivity ? (
              <button
                className="space-y-1.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleAddClick}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Moon className="size-4 shrink-0 opacity-90" />
                  <span className="text-lg font-semibold leading-tight">
                    Sleeping
                  </span>
                </div>
                <div className="flex flex-wrap items-center gap-1 text-sm opacity-70 leading-tight tabular-nums">
                  <span>{formatElapsedTime(elapsedTime)}</span>
                  {currentSleepStartTime && (
                    <>
                      <span>•</span>
                      <span>{currentSleepStartTime}</span>
                    </>
                  )}
                </div>
              </button>
            ) : lastTimeDistance && lastExactTime && lastSleepActivity ? (
              <button
                className="space-y-1.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLastActivityClick}
                type="button"
              >
                <div className="flex items-center gap-2">
                  <Moon className="size-4 shrink-0 opacity-90" />
                  <span className="text-lg font-semibold leading-tight">
                    {lastTimeDistance}
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm opacity-70 leading-tight">
                  {lastExactTime}
                  {lastSleepActivity.duration &&
                    lastSleepActivity.duration > 0 && (
                      <>
                        {' '}
                        •{' '}
                        {formatMinutesToHoursMinutes(
                          lastSleepActivity.duration,
                        )}
                      </>
                    )}
                  {lastSleepUser && (
                    <Avatar className="ml-1 size-4 shrink-0">
                      <AvatarImage
                        alt={lastSleepUser.name}
                        src={lastSleepUser.avatar || ''}
                      />
                      <AvatarFallback className="text-[9px]">
                        {lastSleepUser.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </button>
            ) : (
              <div className="space-y-1">
                <div className="text-sm opacity-60">No recent sleep</div>
              </div>
            )}

            <button
              className="space-y-1 text-right cursor-pointer hover:opacity-80 transition-opacity"
              onClick={handleInfoClick}
              type="button"
            >
              <div className="text-lg font-semibold leading-tight">
                In {nextTimeDistance}
              </div>
              <div className="text-sm opacity-70 leading-tight">
                {nextExactTime}
                {prediction.suggestedDuration && (
                  <>
                    {' • '}
                    {formatDuration(prediction.suggestedDuration)}
                  </>
                )}
              </div>
            </button>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <Button
              className={cn(
                'flex flex-col items-center justify-center h-auto py-3 gap-1',
                'bg-white/20 hover:bg-white/30 active:bg-white/40',
                sleepTheme.textColor,
              )}
              disabled={creatingType !== null || !lastActivitySleep}
              onClick={handleLastActivitySleep}
              variant="ghost"
            >
              {creatingType === 'lastActivity' ? (
                <Icons.Spinner className="size-5" />
              ) : lastActivitySleep ? (
                <lastActivitySleep.activity.icon className="size-5 opacity-90" />
              ) : (
                <Clock className="size-5" />
              )}
              <span className="text-xs font-medium">Since last activity</span>
              {lastActivitySleep && (
                <div className="flex items-center gap-1 text-[10px] opacity-70 leading-tight">
                  <span>{lastActivitySleep.activity.label}</span>
                  <span>
                    {formatTimeWithPreference(
                      lastActivitySleep.activity.time,
                      timeFormat,
                    )}
                  </span>
                  <span>{formatDuration(lastActivitySleep.duration)}</span>
                </div>
              )}
            </Button>

            <Button
              className={cn(
                'flex flex-col items-center justify-center h-auto py-3 gap-1',
                inProgressActivity
                  ? 'bg-destructive/90 hover:bg-destructive active:bg-destructive text-destructive-foreground'
                  : 'bg-white/20 hover:bg-white/30 active:bg-white/40',
                inProgressActivity ? '' : sleepTheme.textColor,
              )}
              disabled={creatingType !== null}
              onClick={handleStartTimer}
              variant="ghost"
            >
              {creatingType === 'timer' ? (
                <Icons.Spinner className="size-5" />
              ) : inProgressActivity ? (
                <StopCircle className="size-5" />
              ) : (
                <Timer className="size-5" />
              )}
              <span className="text-xs font-medium">
                {inProgressActivity ? 'Stop Timer' : 'Start Timer'}
              </span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="sleep"
        averageInterval={prediction.averageIntervalHours}
        babyAgeDays={babyAgeDays}
        calculationDetails={prediction.calculationDetails}
        icon={Moon}
        learningContent={
          babyAgeDays !== null
            ? getSleepLearningContent(babyAgeDays, baby?.firstName || undefined)
            : null
        }
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        quickLogSettings={{
          activeSettings: [],
          enabled: false,
        }}
        timeFormat={timeFormat}
        title="Sleep"
      />

      {/* Stats Drawer */}
      <SleepStatsDrawer
        activities={extendedActivities}
        dailyNapGoal={dailyNapGoal}
        dailySleepHoursGoal={dailySleepHoursGoal}
        goalContext={{
          babyAgeDays,
          babyBirthDate: data.babyBirthDate ?? baby?.birthDate ?? null,
          dataPointsCount: prediction.calculationDetails.dataPoints,
          predictedIntervalHours: prediction.averageIntervalHours,
        }}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        recentActivities={prediction.recentSleepPattern.map((item) => ({
          ...item,
          duration: item.duration ?? undefined,
        }))}
        timeFormat={timeFormat}
      />

      {/* Edit Drawer */}
      {editingActivity &&
        editingActivity.type === 'sleep' &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={handleEditDrawerClose}
            title="Edit Sleep"
          >
            <TimelineSleepDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={editDrawerOpen}
              onClose={handleEditDrawerClose}
            />
          </TimelineDrawerWrapper>
        )}
    </>
  );
}
