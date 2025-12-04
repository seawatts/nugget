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
import { Skeleton } from '@nugget/ui/components/skeleton';
import { Icons } from '@nugget/ui/custom/icons';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { cn } from '@nugget/ui/lib/utils';
import { toast } from '@nugget/ui/sonner';
import {
  Award,
  BarChart3,
  Droplet,
  Droplets,
  Milk,
  Moon,
  StopCircle,
  Trophy,
} from 'lucide-react';
import Link from 'next/link';
import { useParams } from 'next/navigation';
import posthog from 'posthog-js';
import { memo, useEffect, useMemo, useState } from 'react';
import { useDashboardLoadTracker } from '~/app/(app)/app/babies/[babyId]/dashboard/_components/dashboard-load-tracker';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import {
  getUserRelationFromStore,
  useOptimisticActivitiesStore,
} from '~/stores/optimistic-activities';
import { AchievementsDrawer } from './achievements-drawer';
import { TimelineDiaperDrawer } from './activities/diaper/timeline-diaper-drawer';
import { FeedingActivityDrawer } from './activities/feeding/feeding-activity-drawer';
import { calculateNursingVolumes } from './activities/feeding/nursing-volume-calculator';
import { predictNextFeeding } from './activities/feeding/prediction';
import { TimelineFeedingDrawer } from './activities/feeding/timeline-feeding-drawer';
import { getActivityTheme } from './activities/shared/activity-theme-config';
import type { ActivityWithUser } from './activities/shared/components/activity-timeline';
import { StopSleepConfirmationDialog } from './activities/shared/components/stop-sleep-confirmation-dialog';
import { TimelineDrawerWrapper } from './activities/shared/components/timeline-drawer-wrapper';
import { useInProgressSleep } from './activities/shared/hooks/use-in-progress-sleep';
import { formatCompactRelativeTimeWithAgo } from './activities/shared/utils/format-compact-relative-time';
import { SleepActivityDrawer } from './activities/sleep/sleep-activity-drawer';
import { TimelineSleepDrawer } from './activities/sleep/timeline-sleep-drawer';
import { useActivityMutations } from './activities/use-activity-mutations';
import { BabyStatsDrawer } from './baby-stats-drawer';

interface TodaySummaryCardProps {
  babyBirthDate?: Date | null;
  babyName?: string;
  babyPhotoUrl?: string | null;
  babyAvatarBackgroundColor?: string | null;
  measurementUnit?: 'metric' | 'imperial';
}

type AgeUnit = 'days' | 'weeks' | 'months' | 'years' | 'detailed';

// Memoized component to prevent parent re-renders when age updates
const LiveBabyAge = memo(({ birthDate }: { birthDate: Date }) => {
  const [age, setAge] = useState('');
  const [ageUnit, setAgeUnit] = useState<AgeUnit>('days');

  const cycleAgeUnit = () => {
    setAgeUnit((prev) => {
      const units: AgeUnit[] = ['days', 'weeks', 'months', 'years', 'detailed'];
      const currentIndex = units.indexOf(prev);
      const nextIndex = (currentIndex + 1) % units.length;
      return units[nextIndex] ?? units[0] ?? 'days';
    });
  };

  useEffect(() => {
    function updateAge() {
      const now = new Date();
      const birth = new Date(birthDate);
      const diffMs = now.getTime() - birth.getTime();

      const totalDays = diffMs / (1000 * 60 * 60 * 24);

      let formattedAge = '';

      switch (ageUnit) {
        case 'days': {
          const days = Math.floor(totalDays);
          formattedAge = `${days} ${days === 1 ? 'day' : 'days'}`;
          break;
        }
        case 'weeks': {
          const weeks = Math.floor(totalDays / 7);
          const remainingDays = Math.floor(totalDays % 7);
          if (weeks > 0) {
            formattedAge =
              remainingDays > 0
                ? `${weeks}w ${remainingDays}d`
                : `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
          } else {
            formattedAge = `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
          }
          break;
        }
        case 'months': {
          // Approximate months as 30.44 days (average days per month)
          const months = totalDays / 30.44;
          const wholeMonths = Math.floor(months);
          const remainingDays = Math.floor(totalDays % 30.44);
          if (wholeMonths > 0) {
            formattedAge =
              remainingDays > 0
                ? `${wholeMonths}m ${remainingDays}d`
                : `${wholeMonths} ${wholeMonths === 1 ? 'month' : 'months'}`;
          } else {
            formattedAge = `${remainingDays} ${remainingDays === 1 ? 'day' : 'days'}`;
          }
          break;
        }
        case 'years': {
          // Approximate years as 365.25 days (accounting for leap years)
          const years = totalDays / 365.25;
          const wholeYears = Math.floor(years);
          const remainingMonths = Math.floor((totalDays % 365.25) / 30.44);
          if (wholeYears > 0) {
            formattedAge =
              remainingMonths > 0
                ? `${wholeYears}y ${remainingMonths}m`
                : `${wholeYears} ${wholeYears === 1 ? 'year' : 'years'}`;
          } else {
            formattedAge =
              remainingMonths > 0
                ? `${remainingMonths} ${remainingMonths === 1 ? 'month' : 'months'}`
                : `${Math.floor(totalDays)} ${Math.floor(totalDays) === 1 ? 'day' : 'days'}`;
          }
          break;
        }
        case 'detailed': {
          const days = Math.floor(totalDays);
          const hours = Math.floor(
            (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
          );
          const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
          const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

          if (days > 0) {
            formattedAge = `${days}d ${hours}h ${minutes}m ${seconds}s`;
          } else if (hours > 0) {
            formattedAge = `${hours}h ${minutes}m ${seconds}s`;
          } else if (minutes > 0) {
            formattedAge = `${minutes}m ${seconds}s`;
          } else {
            formattedAge = `${seconds}s`;
          }
          break;
        }
      }

      setAge(formattedAge);
    }

    updateAge();
    const interval = setInterval(updateAge, 1000); // Update every second

    return () => clearInterval(interval);
  }, [birthDate, ageUnit]);

  return (
    <button
      className="cursor-pointer hover:opacity-70 transition-opacity bg-transparent border-none p-0 text-inherit"
      onClick={cycleAgeUnit}
      title="Click to cycle between days, weeks, months, years, and detailed timestamp"
      type="button"
    >
      {age}
    </button>
  );
});

LiveBabyAge.displayName = 'LiveBabyAge';

export function TodaySummaryCard({
  babyBirthDate,
  babyName,
  babyPhotoUrl,
  babyAvatarBackgroundColor,
  measurementUnit: _measurementUnit = 'metric',
}: TodaySummaryCardProps) {
  // Get babyId from params (TodaySummaryCard is only used on dashboard which has babyId in URL)
  const params = useParams();
  const babyId = params.babyId as string;
  const tracker = useDashboardLoadTracker();

  // Track when component finishes loading (useSuspenseQuery means it's loaded when rendered)
  useEffect(() => {
    if (tracker) {
      tracker.markComponentLoaded('todaySummary');
    }
  }, [tracker]);

  // Fetch today's activities using optimized query (non-blocking)
  const {
    isLoading: todaySummaryIsLoading,
    isFetching: todaySummaryIsFetching,
  } = api.activities.getTodaySummary.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const { data: celebrationData } =
    api.celebrations.getCarouselContent.useQuery(
      { babyId: babyId ?? '' },
      { enabled: Boolean(babyId), staleTime: 86400000 },
    );

  // Get optimistic activities from Zustand store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Get shared data from dashboard store
  const allActivitiesFromStore = useDashboardDataStore.use.activities();

  // Get user preferences from dashboard store
  const user = useDashboardDataStore.use.user();
  const timeFormat = user?.timeFormat || '12h';

  // State for drawer management
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] =
    useState<ActivityWithUser | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [creatingType, setCreatingType] = useState<
    'bottle' | 'nursing' | 'wet' | 'dirty' | 'sleep-timer' | null
  >(null);
  const [showSleepConfirmation, setShowSleepConfirmation] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [showAchievementsDrawer, setShowAchievementsDrawer] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<{
    type: 'bottle' | 'nursing' | 'wet' | 'dirty';
    data?: {
      amountMl?: number;
      duration?: number;
      feedingSource?: 'formula' | 'pumped' | 'direct';
      side?: 'left' | 'right' | 'both';
    };
  } | null>(null);

  // Activity mutations
  const { createActivity, updateActivity } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );
  const removeOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.removeActivity,
  );
  const removeByMatch = useOptimisticActivitiesStore(
    (state) => state.removeByMatch,
  );
  const utils = api.useUtils();

  // Check for in-progress sleep
  const {
    inProgressSleep,
    sleepDuration,
    durationMinutes: sleepDurationMinutes,
  } = useInProgressSleep({
    babyId,
    enabled: true,
  });

  // Query for in-progress sleep activity (for timer display)
  const { data: inProgressActivity } =
    api.activities.getInProgressActivity.useQuery(
      {
        activityType: 'sleep',
        babyId: babyId ?? '',
      },
      { enabled: Boolean(babyId), refetchInterval: 5000 },
    );

  // Fetch feeding prediction data
  const {
    data: feedingQueryData,
    isLoading: feedingIsLoading,
    isFetching: feedingIsFetching,
  } = api.activities.getUpcomingFeeding.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  // Process feeding prediction data
  const feedingData = feedingQueryData
    ? {
        babyAgeDays: feedingQueryData.babyAgeDays,
        babyBirthDate: feedingQueryData.babyBirthDate,
        prediction: predictNextFeeding(
          [...optimisticActivities, ...feedingQueryData.recentActivities],
          feedingQueryData.babyBirthDate,
          feedingQueryData.feedIntervalHours,
          feedingQueryData.customPreferences,
        ),
        recentActivities: feedingQueryData.recentActivities,
      }
    : null;

  // Get estimated nursing amount
  const getEstimatedNursingAmount = (durationMinutes: number | null) => {
    if (!durationMinutes) {
      return null;
    }
    const ageDays = feedingData?.babyAgeDays ?? null;
    const ageDaysForCalc = ageDays ?? 90;
    const { totalMl } = calculateNursingVolumes(
      ageDaysForCalc,
      durationMinutes,
    );
    return totalMl;
  };

  // Get most common bottle source
  const getMostCommonBottleSource = (): 'formula' | 'pumped' => {
    const activities = allActivitiesFromStore || [];
    const bottleActivities = activities.filter(
      (a) => a.type === 'bottle' && a.feedingSource,
    );

    if (bottleActivities.length === 0) {
      return 'formula'; // Default to formula
    }

    const sourceCounts = bottleActivities.reduce(
      (acc, activity) => {
        const source = activity.feedingSource;
        if (source === 'formula') {
          acc.formula++;
        } else if (source === 'pumped' || source === 'donor') {
          acc.pumped++;
        }
        return acc;
      },
      { formula: 0, pumped: 0 },
    );

    return sourceCounts.formula >= sourceCounts.pumped ? 'formula' : 'pumped';
  };

  // Helper function for age-based nursing duration fallback
  const getAgeBasedNursingDuration = (ageDays: number | null): number => {
    if (ageDays === null) return 20;
    if (ageDays <= 7) return 30;
    if (ageDays <= 30) return 25;
    if (ageDays <= 90) return 20;
    if (ageDays <= 180) return 15;
    return 15;
  };

  // Button handlers
  const handleBottleClick = () => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      {
        action_type: 'bottle',
        baby_id: babyId,
      },
    );
    setOpenDrawer('bottle');
  };

  const handleQuickNursing = async () => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      {
        action_type: 'nursing',
        baby_id: babyId,
      },
    );

    // Use prediction data which already includes user preferences and weights
    // The suggestedDuration is already blended with:
    // - Custom preferences (customPreferences?.feeding?.nursingDurationMinutes)
    // - Preference weights (preferenceWeight)
    // - Recent activity patterns
    // - Age-based defaults
    const duration =
      feedingData?.prediction.suggestedDuration ||
      getAgeBasedNursingDuration(feedingData?.babyAgeDays ?? null);
    const amountMl = getEstimatedNursingAmount(duration);

    // Check for in-progress sleep before creating activity
    if (inProgressSleep) {
      setPendingActivity({
        data: {
          amountMl: amountMl ?? undefined,
          duration,
          feedingSource: 'direct',
          side: 'both',
        },
        type: 'nursing',
      });
      setShowSleepConfirmation(true);
      return;
    }

    setCreatingType('nursing');

    const now = new Date();

    try {
      // Build nursing activity data
      const nursingData = {
        amountMl: amountMl ?? null,
        duration,
        feedingSource: 'direct' as const,
        type: 'nursing' as const,
      };

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        ...nursingData,
        amountMl: nursingData.amountMl ?? null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: {
          side: 'both' as const,
          type: 'nursing' as const,
        },
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        id: `activity-optimistic-nursing-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        updatedAt: now,
        user: getUserRelationFromStore(),
        userId: getUserRelationFromStore()?.id || 'temp',
      } as typeof Activities.$inferSelect;

      // Add optimistic activity to store
      addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      await createActivity(
        {
          activityType: 'nursing',
          amountMl: nursingData.amountMl ?? undefined,
          babyId,
          details: {
            side: 'both',
            type: 'nursing',
          },
          duration,
          endTime: now,
          feedingSource: 'direct',
          startTime: now,
        },
        'today_summary',
      );

      // Remove optimistic activity after real one is created
      removeByMatch('nursing', now, 2000);

      // Don't await - let it invalidate in background
      utils.activities.getUpcomingFeeding.invalidate();
      utils.activities.getTodaySummary.invalidate();
    } catch (err) {
      console.error('Failed to log nursing:', err);
      // Remove optimistic activity on error to avoid stuck state
      removeByMatch('nursing', now, 2000);
      toast.error('Failed to log nursing. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleDiaperClick = async (type: 'wet' | 'dirty') => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      {
        action_type: type,
        baby_id: babyId,
      },
    );

    // Check for in-progress sleep before creating activity
    if (inProgressSleep) {
      setPendingActivity({ type });
      setShowSleepConfirmation(true);
      return;
    }

    setCreatingType(type);

    const now = new Date();

    try {
      // Build diaper activity data
      const diaperData = {
        details: { type },
        type: 'diaper' as const,
      };

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        ...diaperData,
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        duration: 0,
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `activity-optimistic-diaper-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        updatedAt: now,
        user: getUserRelationFromStore(),
        userId: getUserRelationFromStore()?.id || 'temp',
      } as typeof Activities.$inferSelect;

      // Add optimistic activity to store
      addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      await createActivity(
        {
          activityType: 'diaper',
          babyId,
          details: { type },
          endTime: now,
          startTime: now,
        },
        'today_summary',
      );

      // Remove optimistic activity after real one is created
      removeByMatch('diaper', now, 2000);

      // Don't await - let it invalidate in background
      utils.activities.getUpcomingDiaper.invalidate();
      utils.activities.getTodaySummary.invalidate();
    } catch (err) {
      console.error('Failed to log diaper change:', err);
      // Remove optimistic activity on error to avoid stuck state
      removeByMatch('diaper', now, 2000);
      toast.error('Failed to log diaper change. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleSleepTimerClick = async () => {
    // If already tracking, stop the timer
    if (inProgressActivity) {
      posthog.capture(
        buildDashboardEvent(
          DASHBOARD_COMPONENT.TODAY_SUMMARY,
          DASHBOARD_ACTION.QUICK_ACTION,
        ),
        {
          action_type: 'sleep_timer_stop',
          baby_id: babyId,
        },
      );
      setCreatingType('sleep-timer');

      const now = new Date();
      const startTime = new Date(inProgressActivity.startTime);
      const elapsedMinutes =
        (now.getTime() - startTime.getTime()) / (1000 * 60);
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
      addOptimisticActivity(completedActivity);

      // Clear loading state immediately for better UX
      setCreatingType(null);

      try {
        // Update in background - don't await
        updateActivity({
          duration: durationMinutes,
          endTime: now,
          id: inProgressActivity.id,
        })
          .then((_activity) => {
            // Remove optimistic activity after real one is saved
            removeByMatch('sleep', now, 2000);
            // Invalidate queries in background
            utils.activities.getUpcomingSleep.invalidate();
            utils.activities.getInProgressActivity.invalidate();
            utils.activities.getTodaySummary.invalidate();
          })
          .catch((err) => {
            console.error('Failed to stop sleep timer:', err);
            // Remove optimistic activity on error
            removeByMatch('sleep', now, 2000);
            toast.error('Failed to stop timer. Please try again.');
          });

        // Show success toast immediately
        toast.success('Sleep tracking stopped');
      } catch (err) {
        console.error('Failed to stop sleep timer:', err);
        removeByMatch('sleep', now, 2000);
        toast.error('Failed to stop timer. Please try again.');
      }
    } else {
      posthog.capture(
        buildDashboardEvent(
          DASHBOARD_COMPONENT.TODAY_SUMMARY,
          DASHBOARD_ACTION.QUICK_ACTION,
        ),
        {
          action_type: 'sleep_timer_start',
          baby_id: babyId,
        },
      );

      // Start timer
      setCreatingType('sleep-timer');

      const now = new Date();

      try {
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
          user: getUserRelationFromStore(),
          userId: getUserRelationFromStore()?.id || 'temp',
        } as typeof Activities.$inferSelect;

        // Add optimistic activity to store
        addOptimisticActivity(optimisticActivity);

        // Create the actual in-progress activity (no endTime)
        await createActivity(
          {
            activityType: 'sleep',
            babyId,
            details: {
              sleepType,
              type: 'sleep',
            },
            startTime: now,
            // No duration or endTime - this marks it as in-progress
          },
          'today_summary',
        );

        // Remove optimistic activity after real one is created
        removeByMatch('sleep', now, 2000);

        toast.success('Sleep timer started');
        // Don't await - let it invalidate in background
        utils.activities.getUpcomingSleep.invalidate();
        utils.activities.getInProgressActivity.invalidate();
        utils.activities.getTodaySummary.invalidate();
      } catch (err) {
        console.error('Failed to start sleep timer:', err);
        // Remove optimistic activity on error to avoid stuck state
        removeByMatch('sleep', now, 2000);
        toast.error('Failed to start timer. Please try again.');
      } finally {
        setCreatingType(null);
      }
    }
  };

  const handleManualSleepClick = () => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      {
        action_type: 'sleep_manual',
        baby_id: babyId,
      },
    );
    setOpenDrawer('sleep');
  };

  const handleStopSleepAndCreate = async (_e?: React.MouseEvent) => {
    if (!pendingActivity) return;

    setShowSleepConfirmation(false);
    setCreatingType(pendingActivity.type === 'nursing' ? 'nursing' : 'bottle');

    try {
      // Stop the in-progress sleep (non-blocking)
      const { autoStopInProgressSleepAction } = await import(
        './activities/sleep/actions'
      );
      const result = await autoStopInProgressSleepAction({ babyId });
      if (result?.data?.activity) {
        toast.info('Sleep tracking stopped');
      }
    } catch (error) {
      console.error('Failed to stop sleep:', error);
      toast.error('Failed to stop sleep tracking');
    }

    try {
      const now = new Date();
      const { type, data } = pendingActivity;

      if (type === 'bottle' && data?.amountMl) {
        const mostCommonBottleSource = getMostCommonBottleSource();
        const bottleData = {
          amountMl: data.amountMl,
          feedingSource: mostCommonBottleSource,
          type: 'bottle' as const,
        };

        const optimisticActivity = {
          ...bottleData,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: { type: 'bottle' as const },
          duration: 0,
          endTime: now,
          familyId: 'temp',
          familyMemberId: null,
          id: `activity-optimistic-bottle-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: now,
          subjectType: 'baby' as const,
          updatedAt: now,
          user: getUserRelationFromStore(),
          userId: getUserRelationFromStore()?.id || 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity(
          {
            activityType: 'bottle',
            amountMl: data.amountMl,
            babyId,
            duration: 0,
            endTime: now,
            feedingSource: mostCommonBottleSource,
            startTime: now,
          },
          'today_summary',
        );

        removeByMatch('bottle', now, 2000);

        utils.activities.getUpcomingFeeding.invalidate();
        utils.activities.getTodaySummary.invalidate();
      } else if (type === 'nursing' && data?.duration) {
        const computedAmountMl =
          data.amountMl ?? getEstimatedNursingAmount(data.duration ?? null);
        const nursingData = {
          amountMl: computedAmountMl ?? null,
          duration: data.duration,
          feedingSource: 'direct' as const,
          type: 'nursing' as const,
        };

        const side = data.side || 'both';

        const optimisticActivity = {
          ...nursingData,
          amountMl: nursingData.amountMl ?? null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: {
            side: side as 'left' | 'right' | 'both',
            type: 'nursing' as const,
          },
          endTime: now,
          familyId: 'temp',
          familyMemberId: null,
          id: `activity-optimistic-nursing-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: now,
          subjectType: 'baby' as const,
          updatedAt: now,
          user: getUserRelationFromStore(),
          userId: getUserRelationFromStore()?.id || 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity({
          activityType: 'nursing',
          amountMl: nursingData.amountMl ?? undefined,
          babyId,
          details: {
            side: side as 'left' | 'right' | 'both',
            type: 'nursing',
          },
          duration: data.duration,
          endTime: now,
          feedingSource: 'direct',
          startTime: now,
        });

        removeByMatch('nursing', now, 2000);

        utils.activities.getUpcomingFeeding.invalidate();
        utils.activities.getTodaySummary.invalidate();
      } else if (type === 'wet' || type === 'dirty') {
        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: { type },
          duration: 0,
          endTime: now,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `activity-optimistic-diaper-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: now,
          subjectType: 'baby' as const,
          type: 'diaper' as const,
          updatedAt: now,
          user: getUserRelationFromStore(),
          userId: getUserRelationFromStore()?.id || 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity(
          {
            activityType: 'diaper',
            babyId,
            details: { type },
            endTime: now,
            startTime: now,
          },
          'today_summary',
        );

        removeByMatch('diaper', now, 2000);

        utils.activities.getUpcomingDiaper.invalidate();
        utils.activities.getTodaySummary.invalidate();
      }
    } catch (err) {
      console.error(`Failed to log ${pendingActivity.type}:`, err);
      const now = new Date();
      if (pendingActivity.type === 'bottle') {
        removeByMatch('bottle', now, 2000);
      } else if (pendingActivity.type === 'nursing') {
        removeByMatch('nursing', now, 2000);
      } else if (
        pendingActivity.type === 'wet' ||
        pendingActivity.type === 'dirty'
      ) {
        removeByMatch('diaper', now, 2000);
      }
      toast.error(
        `Failed to log ${pendingActivity.type === 'bottle' ? 'bottle feeding' : pendingActivity.type === 'nursing' ? 'nursing' : 'diaper change'}. Please try again.`,
      );
    } finally {
      setCreatingType(null);
      setPendingActivity(null);
    }
  };

  const handleKeepSleepingAndCreate = async () => {
    if (!pendingActivity) return;

    setShowSleepConfirmation(false);
    setCreatingType(pendingActivity.type === 'nursing' ? 'nursing' : 'bottle');

    try {
      const now = new Date();
      const { type, data } = pendingActivity;

      if (type === 'bottle' && data?.amountMl) {
        const mostCommonBottleSource = getMostCommonBottleSource();
        const optimisticActivity = {
          amountMl: data.amountMl,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: { type: 'bottle' as const },
          duration: 0,
          endTime: now,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: mostCommonBottleSource,
          id: `activity-optimistic-bottle-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: now,
          subjectType: 'baby' as const,
          type: 'bottle' as const,
          updatedAt: now,
          user: getUserRelationFromStore(),
          userId: getUserRelationFromStore()?.id || 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity(
          {
            activityType: 'bottle',
            amountMl: data.amountMl,
            babyId,
            duration: 0,
            endTime: now,
            feedingSource: mostCommonBottleSource,
            startTime: now,
          },
          'today_summary',
        );

        removeByMatch('bottle', now, 2000);

        utils.activities.getUpcomingFeeding.invalidate();
        utils.activities.getTodaySummary.invalidate();
      } else if (type === 'nursing' && data?.duration) {
        const computedAmountMl =
          data.amountMl ?? getEstimatedNursingAmount(data.duration ?? null);
        const optimisticActivity = {
          amountMl: computedAmountMl ?? null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: {
            side: (data.side || 'both') as 'left' | 'right' | 'both',
            type: 'nursing' as const,
          },
          duration: data.duration,
          endTime: now,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: 'direct' as const,
          id: `activity-optimistic-nursing-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: now,
          subjectType: 'baby' as const,
          type: 'nursing' as const,
          updatedAt: now,
          user: getUserRelationFromStore(),
          userId: getUserRelationFromStore()?.id || 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity(
          {
            activityType: 'nursing',
            amountMl: computedAmountMl ?? undefined,
            babyId,
            details: {
              side: (data.side || 'both') as 'left' | 'right' | 'both',
              type: 'nursing',
            },
            duration: data.duration,
            endTime: now,
            feedingSource: 'direct',
            startTime: now,
          },
          'today_summary',
        );

        removeByMatch('nursing', now, 2000);

        utils.activities.getUpcomingFeeding.invalidate();
        utils.activities.getTodaySummary.invalidate();
      } else if (type === 'wet' || type === 'dirty') {
        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: { type },
          duration: 0,
          endTime: now,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `activity-optimistic-diaper-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: now,
          subjectType: 'baby' as const,
          type: 'diaper' as const,
          updatedAt: now,
          user: getUserRelationFromStore(),
          userId: getUserRelationFromStore()?.id || 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity(
          {
            activityType: 'diaper',
            babyId,
            details: { type },
            endTime: now,
            startTime: now,
          },
          'today_summary',
        );

        removeByMatch('diaper', now, 2000);

        utils.activities.getUpcomingDiaper.invalidate();
        utils.activities.getTodaySummary.invalidate();
      }
    } catch (err) {
      console.error(`Failed to log ${pendingActivity.type}:`, err);
      const now = new Date();
      if (pendingActivity.type === 'bottle') {
        removeByMatch('bottle', now, 2000);
      } else if (pendingActivity.type === 'nursing') {
        removeByMatch('nursing', now, 2000);
      } else if (
        pendingActivity.type === 'wet' ||
        pendingActivity.type === 'dirty'
      ) {
        removeByMatch('diaper', now, 2000);
      }
      toast.error(
        `Failed to log ${pendingActivity.type === 'bottle' ? 'bottle feeding' : pendingActivity.type === 'nursing' ? 'nursing' : 'diaper change'}. Please try again.`,
      );
    } finally {
      setCreatingType(null);
      setPendingActivity(null);
    }
  };

  const handleDrawerClose = () => {
    setOpenDrawer(null);
  };

  // Format elapsed time for sleep timer
  const formatElapsedTime = (minutes: number): string => {
    if (minutes < 60) {
      return `${minutes}m`;
    }
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    if (remainingMinutes === 0) {
      return `${hours}h`;
    }
    return `${hours}h ${remainingMinutes}m`;
  };

  // Get activity themes
  const feedingTheme = getActivityTheme('feeding');
  const diaperTheme = getActivityTheme('diaper');
  const sleepTheme = getActivityTheme('sleep');
  const SleepIcon = sleepTheme.icon;

  // Fetch diaper and sleep prediction data for last activities with user info
  const {
    data: diaperQueryData,
    isLoading: diaperIsLoading,
    isFetching: diaperIsFetching,
  } = api.activities.getUpcomingDiaper.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const {
    data: sleepQueryData,
    isLoading: sleepIsLoading,
    isFetching: sleepIsFetching,
  } = api.activities.getUpcomingSleep.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  // Find last activities for each type from prediction queries (which include user data)
  const lastBottleActivity = useMemo(() => {
    if (!feedingQueryData?.recentActivities) return null;
    return (
      feedingQueryData.recentActivities.find(
        (a) =>
          a.type === 'bottle' &&
          !a.isScheduled &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true),
      ) || null
    );
  }, [feedingQueryData?.recentActivities]);

  const lastNursingActivity = useMemo(() => {
    if (!feedingQueryData?.recentActivities) return null;
    return (
      feedingQueryData.recentActivities.find(
        (a) =>
          a.type === 'nursing' &&
          !a.isScheduled &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true),
      ) || null
    );
  }, [feedingQueryData?.recentActivities]);

  // Find last wet diaper activity (includes 'both' type)
  const lastWetDiaperActivity = useMemo(() => {
    if (!diaperQueryData?.recentActivities) return null;
    return (
      diaperQueryData.recentActivities.find(
        (a) =>
          (a.type === 'diaper' ||
            a.type === 'wet' ||
            a.type === 'dirty' ||
            a.type === 'both') &&
          !a.isScheduled &&
          !(
            a.details &&
            'skipped' in a.details &&
            a.details.skipped === true
          ) &&
          (a.details?.type === 'wet' || a.details?.type === 'both'),
      ) || null
    );
  }, [diaperQueryData?.recentActivities]);

  // Find last dirty diaper activity (includes 'both' type)
  const lastDirtyDiaperActivity = useMemo(() => {
    if (!diaperQueryData?.recentActivities) return null;
    return (
      diaperQueryData.recentActivities.find(
        (a) =>
          (a.type === 'diaper' ||
            a.type === 'wet' ||
            a.type === 'dirty' ||
            a.type === 'both') &&
          !a.isScheduled &&
          !(
            a.details &&
            'skipped' in a.details &&
            a.details.skipped === true
          ) &&
          (a.details?.type === 'dirty' || a.details?.type === 'both'),
      ) || null
    );
  }, [diaperQueryData?.recentActivities]);

  const lastSleepActivity = useMemo(() => {
    if (!sleepQueryData?.recentActivities) return null;
    return (
      sleepQueryData.recentActivities.find(
        (a) =>
          a.type === 'sleep' &&
          !a.isScheduled &&
          a.endTime !== null &&
          a.duration &&
          a.duration > 0 &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true),
      ) || null
    );
  }, [sleepQueryData?.recentActivities]);

  // Format last activity times
  const lastBottleTime = lastBottleActivity
    ? formatCompactRelativeTimeWithAgo(new Date(lastBottleActivity.startTime))
    : null;
  const lastBottleExactTime = lastBottleActivity
    ? formatTimeWithPreference(
        new Date(lastBottleActivity.startTime),
        timeFormat,
      )
    : null;
  const lastBottleUser = lastBottleActivity?.user
    ? {
        avatar: lastBottleActivity.user.avatarUrl,
        initials: (
          lastBottleActivity.user.firstName?.[0] ||
          lastBottleActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [lastBottleActivity.user.firstName, lastBottleActivity.user.lastName]
            .filter(Boolean)
            .join(' ') || lastBottleActivity.user.email,
      }
    : null;

  const lastNursingTime = lastNursingActivity
    ? formatCompactRelativeTimeWithAgo(new Date(lastNursingActivity.startTime))
    : null;
  const lastNursingExactTime = lastNursingActivity
    ? formatTimeWithPreference(
        new Date(lastNursingActivity.startTime),
        timeFormat,
      )
    : null;
  const lastNursingUser = lastNursingActivity?.user
    ? {
        avatar: lastNursingActivity.user.avatarUrl,
        initials: (
          lastNursingActivity.user.firstName?.[0] ||
          lastNursingActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [
            lastNursingActivity.user.firstName,
            lastNursingActivity.user.lastName,
          ]
            .filter(Boolean)
            .join(' ') || lastNursingActivity.user.email,
      }
    : null;

  // Format last wet diaper activity times
  const lastWetDiaperTime = lastWetDiaperActivity
    ? formatCompactRelativeTimeWithAgo(
        new Date(lastWetDiaperActivity.startTime),
      )
    : null;
  const lastWetDiaperExactTime = lastWetDiaperActivity
    ? formatTimeWithPreference(
        new Date(lastWetDiaperActivity.startTime),
        timeFormat,
      )
    : null;
  const lastWetDiaperUser = lastWetDiaperActivity?.user
    ? {
        avatar: lastWetDiaperActivity.user.avatarUrl,
        initials: (
          lastWetDiaperActivity.user.firstName?.[0] ||
          lastWetDiaperActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [
            lastWetDiaperActivity.user.firstName,
            lastWetDiaperActivity.user.lastName,
          ]
            .filter(Boolean)
            .join(' ') || lastWetDiaperActivity.user.email,
      }
    : null;

  // Format last dirty diaper activity times
  const lastDirtyDiaperTime = lastDirtyDiaperActivity
    ? formatCompactRelativeTimeWithAgo(
        new Date(lastDirtyDiaperActivity.startTime),
      )
    : null;
  const lastDirtyDiaperExactTime = lastDirtyDiaperActivity
    ? formatTimeWithPreference(
        new Date(lastDirtyDiaperActivity.startTime),
        timeFormat,
      )
    : null;
  const lastDirtyDiaperUser = lastDirtyDiaperActivity?.user
    ? {
        avatar: lastDirtyDiaperActivity.user.avatarUrl,
        initials: (
          lastDirtyDiaperActivity.user.firstName?.[0] ||
          lastDirtyDiaperActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [
            lastDirtyDiaperActivity.user.firstName,
            lastDirtyDiaperActivity.user.lastName,
          ]
            .filter(Boolean)
            .join(' ') || lastDirtyDiaperActivity.user.email,
      }
    : null;

  const lastSleepTime = lastSleepActivity
    ? formatCompactRelativeTimeWithAgo(new Date(lastSleepActivity.startTime))
    : null;
  const lastSleepExactTime = lastSleepActivity
    ? formatTimeWithPreference(
        new Date(lastSleepActivity.startTime),
        timeFormat,
      )
    : null;
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

  const upcomingCelebration = useMemo(() => {
    if (!celebrationData || celebrationData.celebration) return null;
    const next = celebrationData.nextCelebration;
    if (!next?.shouldShow) return null;
    const daysUntil = Math.max(0, next.day - (celebrationData.ageInDays ?? 0));
    const cleanedTitle = next.title
      ?.replace(/[🎉🎂]/gu, '')
      .replace(/happy\s+/gi, '')
      .trim();
    return {
      babyLabel: celebrationData.babyName ?? babyName ?? 'Baby',
      daysUntil,
      title: cleanedTitle || 'special day',
    };
  }, [babyName, celebrationData]);

  return (
    <div className="rounded-2xl border border-border/40 bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding backdrop-blur-xl p-6 shadow-xl shadow-activity-nail-trimming/20">
      <div className="mb-4">
        <div className="flex items-center justify-between w-full">
          <div className="flex items-center gap-2.5">
            <Link
              className="relative flex items-center justify-center size-9 rounded-full bg-linear-to-br from-primary to-primary/80 p-[2px] shadow-md shadow-primary/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
              href="/app/settings/baby"
            >
              <div className="size-full rounded-full bg-card flex items-center justify-center p-0.5">
                <NuggetAvatar
                  backgroundColor={babyAvatarBackgroundColor || undefined}
                  image={
                    !babyAvatarBackgroundColor && babyPhotoUrl
                      ? babyPhotoUrl
                      : undefined
                  }
                  name={babyName}
                  size="sm"
                />
              </div>
            </Link>
            <div className="flex flex-col">
              <h2 className="text-lg font-semibold text-foreground leading-tight">
                {babyName ? `${babyName}'s Day` : "Today's Summary"}
              </h2>
              {babyBirthDate && (
                <span className="text-xs text-foreground/80 font-mono leading-tight">
                  <LiveBabyAge birthDate={babyBirthDate} />
                </span>
              )}
            </div>
          </div>
          <div className="flex items-center gap-3">
            {(todaySummaryIsFetching && !todaySummaryIsLoading) ||
            (feedingIsFetching && !feedingIsLoading) ||
            (diaperIsFetching && !diaperIsLoading) ||
            (sleepIsFetching && !sleepIsLoading) ? (
              <Icons.Spinner className="animate-spin opacity-70" size="xs" />
            ) : null}
            <button
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => {
                posthog.capture(
                  buildDashboardEvent(
                    DASHBOARD_COMPONENT.TODAY_SUMMARY,
                    DASHBOARD_ACTION.QUICK_ACTION,
                  ),
                  {
                    action_type: 'stats',
                    baby_id: babyId,
                  },
                );
                setShowStatsDrawer(true);
              }}
              title="View statistics"
              type="button"
            >
              <BarChart3 className="size-5 opacity-70" />
            </button>
            <button
              className="p-1.5 rounded-full hover:bg-white/10 transition-colors"
              onClick={() => {
                posthog.capture(
                  buildDashboardEvent(
                    DASHBOARD_COMPONENT.TODAY_SUMMARY,
                    DASHBOARD_ACTION.QUICK_ACTION,
                  ),
                  {
                    action_type: 'achievements',
                    baby_id: babyId,
                  },
                );
                setShowAchievementsDrawer(true);
              }}
              title="View achievements"
              type="button"
            >
              <Trophy className="size-5 opacity-70" />
            </button>
          </div>
        </div>
        {upcomingCelebration && (
          <div className="mt-3 flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-foreground/90">
            <div className="shrink-0 rounded-full bg-white/20 p-2 text-activity-feeding">
              <Award className="size-4" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-semibold text-foreground">
                {upcomingCelebration.daysUntil === 0
                  ? `Today is ${upcomingCelebration.babyLabel}'s ${upcomingCelebration.title}!`
                  : upcomingCelebration.daysUntil === 1
                    ? `1 day to ${upcomingCelebration.babyLabel}'s ${upcomingCelebration.title}!`
                    : `${upcomingCelebration.daysUntil} days to ${upcomingCelebration.babyLabel}'s ${upcomingCelebration.title}!`}
              </p>
              <p className="text-xs text-foreground/80 leading-snug">
                Come back then to see the celebration.
              </p>
            </div>
          </div>
        )}
      </div>
      <div className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* Bottle Button */}
          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              feedingTheme.textColor,
            )}
            disabled={creatingType !== null}
            onClick={handleBottleClick}
            variant="ghost"
          >
            <Milk className="size-5" />
            <span className="text-xs font-medium">Bottle</span>
            {feedingIsLoading && !lastBottleTime ? (
              <Skeleton className="h-3 w-16 mx-auto" />
            ) : lastBottleTime && lastBottleExactTime ? (
              <div className="flex items-center gap-1 text-xs opacity-70 leading-tight">
                <span>{lastBottleTime}</span>
                {lastBottleUser && (
                  <Avatar className="size-4 shrink-0">
                    <AvatarImage
                      alt={lastBottleUser.name}
                      src={lastBottleUser.avatar || ''}
                    />
                    <AvatarFallback className="text-[8px]">
                      {lastBottleUser.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : null}
          </Button>

          {/* Nursing Button */}
          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              feedingTheme.textColor,
            )}
            disabled={creatingType !== null}
            onClick={handleQuickNursing}
            variant="ghost"
          >
            {creatingType === 'nursing' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Droplet className="size-5" />
            )}
            <span className="text-xs font-medium">Nursing</span>
            {feedingIsLoading && !lastNursingTime ? (
              <Skeleton className="h-3 w-16 mx-auto" />
            ) : lastNursingTime && lastNursingExactTime ? (
              <div className="flex items-center gap-1 text-xs opacity-70 leading-tight">
                <span>{lastNursingTime}</span>
                {lastNursingUser && (
                  <Avatar className="size-4 shrink-0">
                    <AvatarImage
                      alt={lastNursingUser.name}
                      src={lastNursingUser.avatar || ''}
                    />
                    <AvatarFallback className="text-[8px]">
                      {lastNursingUser.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : null}
          </Button>

          {/* Pee Button */}
          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              diaperTheme.textColor,
            )}
            disabled={creatingType !== null}
            onClick={() => handleDiaperClick('wet')}
            variant="ghost"
          >
            {creatingType === 'wet' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Droplet className="size-5" />
            )}
            <span className="text-xs font-medium">Pee</span>
            {diaperIsLoading && !lastWetDiaperTime ? (
              <Skeleton className="h-3 w-16 mx-auto" />
            ) : lastWetDiaperTime && lastWetDiaperExactTime ? (
              <div className="flex items-center gap-1 text-xs opacity-70 leading-tight">
                <span>{lastWetDiaperTime}</span>
                {lastWetDiaperUser && (
                  <Avatar className="size-4 shrink-0">
                    <AvatarImage
                      alt={lastWetDiaperUser.name}
                      src={lastWetDiaperUser.avatar || ''}
                    />
                    <AvatarFallback className="text-[8px]">
                      {lastWetDiaperUser.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : null}
          </Button>

          {/* Poop Button */}
          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              diaperTheme.textColor,
            )}
            disabled={creatingType !== null}
            onClick={() => handleDiaperClick('dirty')}
            variant="ghost"
          >
            {creatingType === 'dirty' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Droplets className="size-5" />
            )}
            <span className="text-xs font-medium">Poop</span>
            {diaperIsLoading && !lastDirtyDiaperTime ? (
              <Skeleton className="h-3 w-16 mx-auto" />
            ) : lastDirtyDiaperTime && lastDirtyDiaperExactTime ? (
              <div className="flex items-center gap-1 text-xs opacity-70 leading-tight">
                <span>{lastDirtyDiaperTime}</span>
                {lastDirtyDiaperUser && (
                  <Avatar className="size-4 shrink-0">
                    <AvatarImage
                      alt={lastDirtyDiaperUser.name}
                      src={lastDirtyDiaperUser.avatar || ''}
                    />
                    <AvatarFallback className="text-[8px]">
                      {lastDirtyDiaperUser.initials}
                    </AvatarFallback>
                  </Avatar>
                )}
              </div>
            ) : null}
          </Button>

          {/* Sleep Actions */}
          <div className="col-span-2 md:col-span-3 grid grid-cols-2 gap-2">
            <Button
              className={cn(
                'flex flex-col items-center justify-center h-auto py-3 gap-1',
                inProgressActivity
                  ? 'bg-destructive/90 hover:bg-destructive active:bg-destructive text-destructive-foreground'
                  : 'bg-white/20 hover:bg-white/30 active:bg-white/40',
                inProgressActivity ? '' : sleepTheme.textColor,
              )}
              disabled={creatingType !== null}
              onClick={handleSleepTimerClick}
              variant="ghost"
            >
              {creatingType === 'sleep-timer' ? (
                <Icons.Spinner className="size-5" />
              ) : inProgressActivity ? (
                <StopCircle className="size-5" />
              ) : (
                <Moon className="size-5" />
              )}
              <span className="text-xs font-medium">
                {inProgressActivity ? 'Stop Timer' : 'Start Timer'}
              </span>
              {inProgressActivity && sleepDurationMinutes > 0 ? (
                <span className="text-xs opacity-80">
                  {formatElapsedTime(sleepDurationMinutes)}
                </span>
              ) : sleepIsLoading && !lastSleepTime ? (
                <Skeleton className="h-3 w-16 mx-auto" />
              ) : lastSleepTime && lastSleepExactTime ? (
                <div className="flex items-center gap-1 text-xs opacity-70 leading-tight">
                  <span>{lastSleepTime}</span>
                  {lastSleepUser && (
                    <Avatar className="size-4 shrink-0">
                      <AvatarImage
                        alt={lastSleepUser.name}
                        src={lastSleepUser.avatar || ''}
                      />
                      <AvatarFallback className="text-[8px]">
                        {lastSleepUser.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              ) : null}
            </Button>
            <Button
              className={cn(
                'flex flex-col items-center justify-center h-auto py-3 gap-1',
                'bg-white/20 hover:bg-white/30 active:bg-white/40',
                sleepTheme.textColor,
              )}
              disabled={creatingType !== null}
              onClick={handleManualSleepClick}
              variant="ghost"
            >
              <SleepIcon className="size-5" />
              <span className="text-xs font-medium">Log Sleep</span>
              <span className="text-xs opacity-70 leading-tight">
                Manual entry
              </span>
            </Button>
          </div>
        </div>
      </div>

      {/* Activity Edit Drawers */}
      {editingActivity &&
        (editingActivity.type === 'feeding' ||
          editingActivity.type === 'nursing' ||
          editingActivity.type === 'bottle' ||
          editingActivity.type === 'solids') &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              setEditingActivity(null);
              setOpenDrawer(null);
            }}
            title="Edit Feeding"
          >
            <TimelineFeedingDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={editDrawerOpen}
              onClose={() => {
                setEditDrawerOpen(false);
                setEditingActivity(null);
                setOpenDrawer(null);
              }}
            />
          </TimelineDrawerWrapper>
        )}

      {editingActivity &&
        editingActivity.type === 'sleep' &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              setEditingActivity(null);
              setOpenDrawer(null);
            }}
            title="Edit Sleep"
          >
            <TimelineSleepDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={editDrawerOpen}
              onClose={() => {
                setEditDrawerOpen(false);
                setEditingActivity(null);
                setOpenDrawer(null);
              }}
            />
          </TimelineDrawerWrapper>
        )}

      {editingActivity &&
        (editingActivity.type === 'diaper' ||
          editingActivity.type === 'wet' ||
          editingActivity.type === 'dirty' ||
          editingActivity.type === 'both') &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={() => {
              setEditDrawerOpen(false);
              setEditingActivity(null);
              setOpenDrawer(null);
            }}
            title="Edit Diaper"
          >
            <TimelineDiaperDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={editDrawerOpen}
              onClose={() => {
                setEditDrawerOpen(false);
                setEditingActivity(null);
                setOpenDrawer(null);
              }}
            />
          </TimelineDrawerWrapper>
        )}

      {/* Feeding Drawer */}
      {(openDrawer === 'feeding' ||
        openDrawer === 'bottle' ||
        openDrawer === 'nursing') && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Log Feeding"
        >
          <FeedingActivityDrawer
            babyId={babyId}
            existingActivity={null}
            initialType={
              openDrawer === 'bottle'
                ? 'bottle'
                : openDrawer === 'nursing'
                  ? 'nursing'
                  : null
            }
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {openDrawer === 'sleep' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Log Sleep"
        >
          <SleepActivityDrawer
            babyId={babyId}
            existingActivity={null}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Sleep Stop Confirmation Dialog */}
      <StopSleepConfirmationDialog
        onKeepSleeping={handleKeepSleepingAndCreate}
        onOpenChange={setShowSleepConfirmation}
        onStopSleep={handleStopSleepAndCreate}
        open={showSleepConfirmation}
        sleepDuration={sleepDuration}
      />

      {/* Baby Stats Drawer */}
      <BabyStatsDrawer
        babyId={babyId}
        measurementUnit={_measurementUnit}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
      />

      {/* Achievements Drawer */}
      <AchievementsDrawer
        babyId={babyId}
        onOpenChange={setShowAchievementsDrawer}
        open={showAchievementsDrawer}
      />
    </div>
  );
}
