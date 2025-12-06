'use client';

import {
  buildDashboardEvent,
  DASHBOARD_ACTION,
  DASHBOARD_COMPONENT,
} from '@nugget/analytics/utils';
import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { toast } from '@nugget/ui/sonner';
import posthog from 'posthog-js';
import { useState } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import {
  getUserRelationFromStore,
  useOptimisticActivitiesStore,
} from '~/stores/optimistic-activities';
import { calculateNursingVolumes } from '../../activities/feeding/nursing-volume-calculator';
import { useInProgressSleep } from '../../activities/shared/hooks/use-in-progress-sleep';
import { useActivityMutations } from '../../activities/use-activity-mutations';
import type {
  PendingActivity,
  QuickActionType,
} from '../today-summary-card.types';
import { getAgeBasedNursingDuration } from '../today-summary-card.utils';
import type { TodaySummaryQueriesResult } from './use-today-summary-queries';

interface UseQuickActionsOptions {
  babyId: string;
  queries: TodaySummaryQueriesResult;
}

export function useQuickActions({ babyId, queries }: UseQuickActionsOptions) {
  const { feedingData, inProgressActivity } = queries;

  // State
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [creatingType, setCreatingType] = useState<QuickActionType>(null);
  const [showSleepConfirmation, setShowSleepConfirmation] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [showAchievementsDrawer, setShowAchievementsDrawer] = useState(false);
  const [pendingActivity, setPendingActivity] =
    useState<PendingActivity | null>(null);

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

  // Get all activities from store for bottle source calculation
  const allActivitiesFromStore = useDashboardDataStore.use.activities();

  // Check for in-progress sleep
  const {
    inProgressSleep,
    sleepDuration,
    durationMinutes: sleepDurationMinutes,
  } = useInProgressSleep({
    babyId,
    enabled: true,
  });

  // Helper functions
  const getEstimatedNursingAmount = (durationMinutes: number | null) => {
    if (!durationMinutes) return null;
    const ageDays = feedingData?.babyAgeDays ?? null;
    const ageDaysForCalc = ageDays ?? 90;
    const { totalMl } = calculateNursingVolumes(
      ageDaysForCalc,
      durationMinutes,
    );
    return totalMl;
  };

  const getMostCommonBottleSource = (): 'formula' | 'pumped' => {
    const activities = allActivitiesFromStore || [];
    const bottleActivities = activities.filter(
      (a) => a.type === 'bottle' && a.feedingSource,
    );

    if (bottleActivities.length === 0) return 'formula';

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

  // Handler functions
  const handleBottleClick = () => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      { action_type: 'bottle', baby_id: babyId },
    );
    setOpenDrawer('bottle');
  };

  const handleQuickNursing = async () => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      { action_type: 'nursing', baby_id: babyId },
    );

    const duration =
      feedingData?.prediction.suggestedDuration ||
      getAgeBasedNursingDuration(feedingData?.babyAgeDays ?? null);
    const amountMl = getEstimatedNursingAmount(duration);

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
      const nursingData = {
        amountMl: amountMl ?? null,
        duration,
        feedingSource: 'direct' as const,
        type: 'nursing' as const,
      };

      const optimisticActivity = {
        ...nursingData,
        amountMl: nursingData.amountMl ?? null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: { side: 'both' as const, type: 'nursing' as const },
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

      const activity = await createActivity(
        {
          activityType: 'nursing',
          amountMl: nursingData.amountMl ?? undefined,
          babyId,
          details: { side: 'both', type: 'nursing' },
          duration,
          endTime: now,
          feedingSource: 'direct',
          startTime: now,
        },
        'today_summary',
      );

      if (!activity || !activity.id) {
        throw new Error('Activity creation returned invalid response');
      }

      removeByMatch('nursing', now, 2000);
      utils.activities.getUpcomingFeeding.invalidate();
      utils.activities.getTodaySummary.invalidate();
    } catch (err) {
      console.error('Failed to log nursing:', err);
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
      { action_type: type, baby_id: babyId },
    );

    if (inProgressSleep) {
      setPendingActivity({ type });
      setShowSleepConfirmation(true);
      return;
    }

    setCreatingType(type);
    const now = new Date();

    try {
      const diaperData = {
        details: { type },
        type: 'diaper' as const,
      };

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

      addOptimisticActivity(optimisticActivity);

      const activity = await createActivity(
        {
          activityType: 'diaper',
          babyId,
          details: { type },
          endTime: now,
          startTime: now,
        },
        'today_summary',
      );

      if (!activity || !activity.id) {
        throw new Error('Activity creation returned invalid response');
      }

      removeByMatch('diaper', now, 2000);
      utils.activities.getUpcomingDiaper.invalidate();
      utils.activities.getTodaySummary.invalidate();
    } catch (err) {
      console.error('Failed to log diaper change:', err);
      removeByMatch('diaper', now, 2000);
      toast.error('Failed to log diaper change. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleSleepTimerClick = async () => {
    if (inProgressActivity) {
      // Stop the timer
      posthog.capture(
        buildDashboardEvent(
          DASHBOARD_COMPONENT.TODAY_SUMMARY,
          DASHBOARD_ACTION.QUICK_ACTION,
        ),
        { action_type: 'sleep_timer_stop', baby_id: babyId },
      );
      setCreatingType('sleep-timer');

      const now = new Date();
      const startTime = new Date(inProgressActivity.startTime);
      const elapsedMinutes =
        (now.getTime() - startTime.getTime()) / (1000 * 60);
      const durationMinutes = Math.max(1, Math.ceil(elapsedMinutes));

      const completedActivity = {
        ...inProgressActivity,
        duration: durationMinutes,
        endTime: now,
        updatedAt: now,
      };

      removeOptimisticActivity(inProgressActivity.id);
      addOptimisticActivity(completedActivity);

      try {
        const activity = await updateActivity({
          duration: durationMinutes,
          endTime: now,
          id: inProgressActivity.id,
        });

        if (activity?.id) {
          removeByMatch('sleep', now, 2000);
          utils.activities.getUpcomingSleep.invalidate();
          utils.activities.getInProgressActivity.invalidate();
          utils.activities.getTodaySummary.invalidate();
          toast.success('Sleep tracking stopped');
        } else {
          throw new Error('Failed to update activity');
        }
      } catch (err) {
        console.error('Failed to stop sleep timer:', err);
        removeByMatch('sleep', now, 2000);
        toast.error('Failed to stop timer. Please try again.');
      } finally {
        setCreatingType(null);
      }
    } else {
      // Start timer
      posthog.capture(
        buildDashboardEvent(
          DASHBOARD_COMPONENT.TODAY_SUMMARY,
          DASHBOARD_ACTION.QUICK_ACTION,
        ),
        { action_type: 'sleep_timer_start', baby_id: babyId },
      );

      setCreatingType('sleep-timer');
      const now = new Date();

      try {
        const hour = now.getHours();
        const sleepType = hour >= 6 && hour < 18 ? 'nap' : 'night';

        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: { sleepType, type: 'sleep' as const },
          duration: 0,
          endTime: null,
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

        addOptimisticActivity(optimisticActivity);

        const activity = await createActivity(
          {
            activityType: 'sleep',
            babyId,
            details: { sleepType, type: 'sleep' },
            startTime: now,
          },
          'today_summary',
        );

        if (!activity || !activity.id) {
          throw new Error('Activity creation returned invalid response');
        }

        removeByMatch('sleep', now, 2000);
        toast.success('Sleep timer started');
        utils.activities.getUpcomingSleep.invalidate();
        utils.activities.getInProgressActivity.invalidate();
        utils.activities.getTodaySummary.invalidate();
      } catch (err) {
        console.error('Failed to start sleep timer:', err);
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
      { action_type: 'sleep_manual', baby_id: babyId },
    );
    setOpenDrawer('sleep');
  };

  const handleStopSleepAndCreate = async () => {
    if (!pendingActivity) return;

    setShowSleepConfirmation(false);
    setCreatingType(pendingActivity.type === 'nursing' ? 'nursing' : 'bottle');

    try {
      const { autoStopInProgressSleepAction } = await import(
        '../../activities/sleep/actions'
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

        const bottleActivity = await createActivity(
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

        if (!bottleActivity || !bottleActivity.id) {
          throw new Error('Activity creation returned invalid response');
        }

        removeByMatch('bottle', now, 2000);
        utils.activities.getUpcomingFeeding.invalidate();
        utils.activities.getTodaySummary.invalidate();
      } else if (type === 'nursing' && data?.duration) {
        const computedAmountMl =
          data.amountMl ?? getEstimatedNursingAmount(data.duration ?? null);
        const side = data.side || 'both';

        const optimisticActivity = {
          amountMl: computedAmountMl ?? null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: now,
          details: {
            side: side as 'left' | 'right' | 'both',
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

        const nursingActivity = await createActivity({
          activityType: 'nursing',
          amountMl: computedAmountMl ?? undefined,
          babyId,
          details: { side: side as 'left' | 'right' | 'both', type: 'nursing' },
          duration: data.duration,
          endTime: now,
          feedingSource: 'direct',
          startTime: now,
        });

        if (!nursingActivity || !nursingActivity.id) {
          throw new Error('Activity creation returned invalid response');
        }

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

        const diaperActivity = await createActivity(
          {
            activityType: 'diaper',
            babyId,
            details: { type },
            endTime: now,
            startTime: now,
          },
          'today_summary',
        );

        if (!diaperActivity || !diaperActivity.id) {
          throw new Error('Activity creation returned invalid response');
        }

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

        const bottleActivity = await createActivity(
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

        if (!bottleActivity || !bottleActivity.id) {
          throw new Error('Activity creation returned invalid response');
        }

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

        const nursingActivity = await createActivity(
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

        if (!nursingActivity || !nursingActivity.id) {
          throw new Error('Activity creation returned invalid response');
        }

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

        const diaperActivity = await createActivity(
          {
            activityType: 'diaper',
            babyId,
            details: { type },
            endTime: now,
            startTime: now,
          },
          'today_summary',
        );

        if (!diaperActivity || !diaperActivity.id) {
          throw new Error('Activity creation returned invalid response');
        }

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

  const handleStatsClick = () => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      { action_type: 'stats', baby_id: babyId },
    );
    setShowStatsDrawer(true);
  };

  const handleAchievementsClick = () => {
    posthog.capture(
      buildDashboardEvent(
        DASHBOARD_COMPONENT.TODAY_SUMMARY,
        DASHBOARD_ACTION.QUICK_ACTION,
      ),
      { action_type: 'achievements', baby_id: babyId },
    );
    setShowAchievementsDrawer(true);
  };

  return {
    creatingType,
    handleAchievementsClick,

    // Handlers
    handleBottleClick,
    handleDiaperClick,
    handleDrawerClose,
    handleKeepSleepingAndCreate,
    handleManualSleepClick,
    handleQuickNursing,
    handleSleepTimerClick,
    handleStatsClick,
    handleStopSleepAndCreate,
    inProgressActivity,

    // Sleep state
    inProgressSleep,
    // State
    openDrawer,
    setOpenDrawer,
    setShowAchievementsDrawer,
    setShowSleepConfirmation,
    setShowStatsDrawer,
    showAchievementsDrawer,
    showSleepConfirmation,
    showStatsDrawer,
    sleepDuration,
    sleepDurationMinutes,
  };
}

export type QuickActionsResult = ReturnType<typeof useQuickActions>;
