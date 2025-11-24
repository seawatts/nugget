'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { toast } from '@nugget/ui/sonner';
import { formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { Clock, Moon, StopCircle, Timer } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getActivityTheme } from '../shared/activity-theme-config';
import {
  PredictiveCardHeader,
  PredictiveCardSkeleton,
  PredictiveInfoDrawer,
} from '../shared/components/predictive-cards';
import { formatMinutesToHoursMinutes } from '../shared/time-formatting-utils';
import { useActivityMutations } from '../use-activity-mutations';
import { quickLogSleepAction } from './actions';
import { SleepStatsDrawer } from './components';
import { getSleepLearningContent } from './learning-content';
import { predictNextSleep } from './prediction';
import { calculateSleepTrendData } from './sleep-goals';

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

  // Filter to today's activities for goal display
  const todaysActivitiesData = allActivities?.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    return activityDate >= startOfDay(new Date());
  });

  // Filter to last 7 days for trend data
  const sevenDaysAgo = startOfDay(subDays(new Date(), 7));
  const last7DaysActivities = allActivities?.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    return activityDate >= sevenDaysAgo;
  });

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
  const [creatingType, setCreatingType] = useState<
    '1hr' | '2hr' | 'timer' | null
  >(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

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

  // Find the most recent sleep activity with user info
  const lastSleepActivity = useMemo(() => {
    if (!queryData?.recentActivities) return null;

    return queryData.recentActivities.find(
      (a) =>
        a.type === 'sleep' &&
        !a.isScheduled &&
        a.endTime !== null && // Only show completed activities
        a.duration &&
        a.duration > 0 && // Must have duration
        !(a.details && 'skipped' in a.details && a.details.skipped === true),
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

  const { prediction, babyAgeDays } = data;

  // Format time displays
  const nextTimeDistance = formatDistanceToNow(prediction.nextSleepTime, {
    addSuffix: false,
  });
  const nextExactTime = formatTimeWithPreference(
    prediction.nextSleepTime,
    timeFormat,
  );

  const lastTimeDistance = prediction.lastSleepTime
    ? formatDistanceToNow(prediction.lastSleepTime, { addSuffix: false })
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

  const handleQuick1Hour = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreatingType('1hr');

    let tempId: string | null = null;

    try {
      const now = new Date();
      const duration = 60; // 1 hour in minutes

      // Calculate start time (1 hour ago)
      const startTime = new Date(now.getTime() - duration * 60 * 1000);

      // Determine sleep type based on time of day
      const hour = startTime.getHours();
      const sleepType = hour >= 6 && hour < 18 ? 'nap' : 'night';

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: {
          sleepType,
          type: 'sleep' as const,
        },
        duration,
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `activity-optimistic-sleep-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: startTime,
        subjectType: 'baby' as const,
        type: 'sleep' as const,
        updatedAt: now,
        user: userData || null, // Include user data for display
        userId: userData?.id || 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity using the server action
      const result = await quickLogSleepAction({
        babyId,
        duration,
        time: now.toISOString(),
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
      console.error('Failed to log 1 hour sleep:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log sleep. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleQuick2Hours = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreatingType('2hr');

    let tempId: string | null = null;

    try {
      const now = new Date();
      const duration = 120; // 2 hours in minutes

      // Calculate start time (2 hours ago)
      const startTime = new Date(now.getTime() - duration * 60 * 1000);

      // Determine sleep type based on time of day
      const hour = startTime.getHours();
      const sleepType = hour >= 6 && hour < 18 ? 'nap' : 'night';

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: {
          sleepType,
          type: 'sleep' as const,
        },
        duration,
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `activity-optimistic-sleep-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: startTime,
        subjectType: 'baby' as const,
        type: 'sleep' as const,
        updatedAt: now,
        user: userData || null, // Include user data for display
        userId: userData?.id || 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity using the server action
      const result = await quickLogSleepAction({
        babyId,
        duration,
        time: now.toISOString(),
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
      console.error('Failed to log 2 hours sleep:', err);
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

    setCreatingType('timer');

    let tempId: string | null = null;

    try {
      const now = new Date();

      // Determine sleep type based on time of day
      const hour = now.getHours();
      const sleepType = hour >= 6 && hour < 18 ? 'nap' : 'night';

      // Create optimistic activity for immediate UI feedback
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
        user: userData || null, // Include user data for display
        userId: userData?.id || 'temp',
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

    setCreatingType('timer');

    const now = new Date();
    const startTime = new Date(inProgressActivity.startTime);
    const durationMinutes = Math.floor(
      (now.getTime() - startTime.getTime()) / (1000 * 60),
    );

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
    setShowStatsDrawer(true);
  };

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onOpenDrawer?.();
  };

  const sleepTheme = getActivityTheme('sleep');
  const SleepIcon = sleepTheme.icon;

  // Calculate today's sleep statistics for goal display (for stats drawer)
  // const todaysStats = calculateTodaysSleepStats(todaysActivitiesData ?? []);
  // const dailyNapGoal = getDailyNapGoal(
  //   babyAgeDays ?? 0,
  //   prediction.averageIntervalHours,
  //   prediction.calculationDetails.dataPoints,
  // );
  // const dailySleepHoursGoal = getDailySleepHoursGoal(babyAgeDays ?? 0);
  const trendData = calculateSleepTrendData(todaysActivitiesData ?? []);

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 border-0 col-span-2',
          `bg-${sleepTheme.color} ${sleepTheme.textColor}`,
        )}
      >
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

        {/* Timeline Layout - Full Width */}
        <div className="relative py-4 mt-4">
          {/* Timeline dots and connecting line */}
          <div className="absolute top-4 left-0 right-0 flex items-center justify-between px-4">
            <div className="w-2.5 h-2.5 rounded-full bg-white/40 shrink-0" />
            <div className="flex-1 border-t border-white/20 mx-2" />
            <div className="w-2.5 h-2.5 rounded-full bg-white/40 shrink-0" />
          </div>

          {/* Two-column content grid */}
          <div className="grid grid-cols-2 gap-6 pt-6 px-2">
            {/* Left Column: Last Sleep or Currently Sleeping */}
            {inProgressActivity ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Moon className="size-4 shrink-0 opacity-90" />
                  <span className="text-lg font-semibold leading-tight">
                    Sleeping
                  </span>
                </div>
                <div className="text-sm opacity-70 leading-tight tabular-nums">
                  {formatElapsedTime(elapsedTime)}
                </div>
              </div>
            ) : lastTimeDistance && lastExactTime && lastSleepActivity ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Moon className="size-4 shrink-0 opacity-90" />
                  <span className="text-lg font-semibold leading-tight">
                    {lastTimeDistance} ago
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
                    <Avatar className="size-4 shrink-0 ml-1">
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
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm opacity-60">No recent sleep</div>
              </div>
            )}

            {/* Right Column: Next Sleep */}
            <div className="space-y-1">
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
            </div>
          </div>
        </div>

        {/* Quick Action Buttons - 3 buttons in a grid */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              sleepTheme.textColor,
            )}
            disabled={creatingType !== null}
            onClick={handleQuick1Hour}
            variant="ghost"
          >
            {creatingType === '1hr' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
            <span className="text-xs font-medium">1 Hour</span>
          </Button>

          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              sleepTheme.textColor,
            )}
            disabled={creatingType !== null}
            onClick={handleQuick2Hours}
            variant="ghost"
          >
            {creatingType === '2hr' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Clock className="size-5" />
            )}
            <span className="text-xs font-medium">2 Hours</span>
          </Button>

          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              sleepTheme.textColor,
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
        activities={last7DaysActivities ?? []}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        recentActivities={prediction.recentSleepPattern.map((item) => ({
          ...item,
          duration: item.duration ?? undefined,
        }))}
        timeFormat={timeFormat}
        trendData={trendData}
      />
    </>
  );
}
