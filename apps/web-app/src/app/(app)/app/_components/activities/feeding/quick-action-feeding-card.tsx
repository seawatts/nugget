'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import { toast } from '@nugget/ui/sonner';
import { formatDistanceToNow } from 'date-fns';
import { Droplet, Milk } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getActivityTheme } from '../shared/activity-theme-config';
import {
  PredictiveCardHeader,
  PredictiveCardSkeleton,
  PredictiveInfoDrawer,
} from '../shared/components/predictive-cards';
import { PredictiveProgressTrack } from '../shared/components/predictive-progress-track';
import { StopSleepConfirmationDialog } from '../shared/components/stop-sleep-confirmation-dialog';
import { TimelineDrawerWrapper } from '../shared/components/timeline-drawer-wrapper';
import { getFeedingDailyProgress } from '../shared/daily-progress';
import { useInProgressSleep } from '../shared/hooks/use-in-progress-sleep';
import {
  formatVolumeDisplay,
  getVolumeUnit,
  mlToOz,
} from '../shared/volume-utils';
import { autoStopInProgressSleepAction } from '../sleep/actions';
import { useActivityMutations } from '../use-activity-mutations';
import { FeedingStatsDrawer } from './components';
import { FeedingActionButtons } from './feeding-action-buttons';
import { getFeedingLearningContent } from './learning-content';
import { predictNextFeeding } from './prediction';
import { TimelineFeedingDrawer } from './timeline-feeding-drawer';

interface QuickActionFeedingCardProps {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  onOpenDrawer?: () => void;
}

/**
 * Determines the most common bottle feeding source from recent activities
 */
function getMostCommonBottleSource(
  activities: Array<typeof Activities.$inferSelect>,
): 'formula' | 'pumped' {
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
}

export function QuickActionFeedingCard({
  onActivityLogged,
  onOpenDrawer,
}: QuickActionFeedingCardProps) {
  const params = useParams();
  const babyId = params.babyId as string;

  // Get shared data from dashboard store (populated by DashboardContainer)
  const userData = useDashboardDataStore.use.user();
  const allActivities = useDashboardDataStore.use.activities();
  const baby = useDashboardDataStore.use.baby();

  const timeFormat = userData?.timeFormat || '12h';
  const userUnitPref = getVolumeUnit(userData?.measurementUnit || 'metric');

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
  } = api.activities.getUpcomingFeeding.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [creatingType, setCreatingType] = useState<
    'bottle' | 'nursing-left' | 'nursing-right' | null
  >(null);
  const [showSleepConfirmation, setShowSleepConfirmation] = useState(false);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<{
    type: 'bottle' | 'nursing';
    data: {
      amountMl?: number;
      duration?: number;
      feedingSource?: 'formula' | 'pumped' | 'direct';
      side?: 'left' | 'right';
    };
  } | null>(null);

  const { createActivity } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );
  const removeOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.removeActivity,
  );
  const utils = api.useUtils();

  // Check for in-progress sleep
  const { inProgressSleep, sleepDuration } = useInProgressSleep({
    babyId,
    enabled: true,
  });

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        babyBirthDate: queryData.babyBirthDate,
        prediction: predictNextFeeding(
          [...optimisticActivities, ...queryData.recentActivities],
          queryData.babyBirthDate,
          queryData.feedIntervalHours,
          queryData.customPreferences,
        ),
        recentActivities: queryData.recentActivities,
      }
    : null;

  const feedingProgress = useMemo(
    () =>
      getFeedingDailyProgress({
        activities: mergedActivities,
        babyAgeDays: data?.babyAgeDays ?? null,
        unitPreference: userUnitPref.toUpperCase() as 'ML' | 'OZ',
      }),
    [data?.babyAgeDays, mergedActivities, userUnitPref],
  );

  const feedingStartLabel =
    typeof feedingProgress?.currentValue === 'number'
      ? `${formatVolumeDisplay(feedingProgress.currentValue, userUnitPref)} ${userUnitPref} Today`
      : `0 ${userUnitPref} Today`;
  const feedingEndLabel =
    typeof feedingProgress?.goalValue === 'number'
      ? (() => {
          const goalValue =
            userUnitPref === 'OZ'
              ? Math.floor(mlToOz(feedingProgress.goalValue))
              : Math.round(feedingProgress.goalValue);
          return `Goal ${goalValue} ${userUnitPref}`;
        })()
      : null;

  // Find the most recent feeding activity with user info
  const lastFeedingActivity = useMemo(() => {
    if (!queryData?.recentActivities) return null;

    return queryData.recentActivities.find(
      (a) =>
        (a.type === 'bottle' || a.type === 'nursing' || a.type === 'solids') &&
        !a.isScheduled &&
        !(a.details && 'skipped' in a.details && a.details.skipped === true),
    );
  }, [queryData?.recentActivities]);

  // Get icon for last feeding activity type
  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'bottle':
        return Milk;
      case 'nursing':
        return Droplet;
      default:
        return Milk;
    }
  };

  // Get age-based feeding amount as fallback (in ml)
  const getAgeBasedAmount = (ageDays: number | null): number => {
    if (!ageDays) return 120; // Default to 4oz if age unknown

    if (ageDays <= 2) return 45; // 1.5 oz
    if (ageDays <= 7) return 75; // 2.5 oz
    if (ageDays <= 14) return 90; // 3 oz
    if (ageDays <= 30) return 120; // 4 oz
    if (ageDays <= 60) return 150; // 5 oz
    return 180; // 6 oz for 61+ days
  };

  // Get age-based nursing duration as fallback (in minutes)
  const getAgeBasedDuration = (ageDays: number | null): number => {
    if (!ageDays) return 20; // Default if age unknown
    if (ageDays <= 7) return 30; // Week 1: 30 minutes
    if (ageDays <= 30) return 25; // Weeks 2-4: 25 minutes
    if (ageDays <= 90) return 20; // Months 2-3: 20 minutes
    if (ageDays <= 180) return 15; // Months 4-6: 15 minutes
    return 15; // 6+ months: 15 minutes
  };

  // Get user info from last feeding
  const lastFeedingUser = lastFeedingActivity?.user
    ? {
        avatar: lastFeedingActivity.user.avatarUrl,
        initials: (
          lastFeedingActivity.user.firstName?.[0] ||
          lastFeedingActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [
            lastFeedingActivity.user.firstName,
            lastFeedingActivity.user.lastName,
          ]
            .filter(Boolean)
            .join(' ') || lastFeedingActivity.user.email,
      }
    : null;

  const error = queryError?.message || null;

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
    return <PredictiveCardSkeleton activityType="feeding" />;
  }

  if (!data) return null;

  const { prediction } = data;

  // Determine most common bottle source
  const mostCommonBottleSource = getMostCommonBottleSource(allActivities || []);

  // Format amount for display based on user preference
  const formatAmount = (ml: number | null) => {
    if (!ml) return null;
    return formatVolumeDisplay(ml, userUnitPref, true);
  };

  // Format time displays
  const nextTimeDistance = formatDistanceToNow(prediction.nextFeedingTime, {
    addSuffix: false,
  }).replace(/^about /, '');
  const nextExactTime = formatTimeWithPreference(
    prediction.nextFeedingTime,
    timeFormat,
  );

  const lastTimeDistance = prediction.lastFeedingTime
    ? formatDistanceToNow(prediction.lastFeedingTime, {
        addSuffix: false,
      }).replace(/^about /, '')
    : null;
  const lastExactTime = prediction.lastFeedingTime
    ? formatTimeWithPreference(prediction.lastFeedingTime, timeFormat)
    : null;

  const handleQuickBottle = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Use predicted amount if available, otherwise fall back to age-based amount
    const amountMl =
      prediction.suggestedAmount ||
      getAgeBasedAmount(data?.babyAgeDays || null);

    // Check for in-progress sleep before creating activity
    if (inProgressSleep) {
      // Store activity data and show confirmation dialog
      setPendingActivity({
        data: {
          amountMl,
          feedingSource: mostCommonBottleSource,
        },
        type: 'bottle',
      });
      setShowSleepConfirmation(true);
      return;
    }

    setCreatingType('bottle');

    let tempId: string | null = null;

    try {
      const now = new Date();

      // Build bottle activity data
      const bottleData = {
        amountMl,
        feedingSource: mostCommonBottleSource,
        type: 'bottle' as const,
      };

      // Create optimistic activity for immediate UI feedback
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
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'bottle',
        amountMl,
        babyId,
        duration: 0,
        endTime: now,
        feedingSource: mostCommonBottleSource,
        startTime: now,
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      // Don't await - let it invalidate in background (mutation already handles invalidation)
      utils.activities.getUpcomingFeeding.invalidate();
    } catch (err) {
      console.error('Failed to log bottle feeding:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log bottle feeding. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleQuickNursingLeft = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Use predicted duration if available, otherwise use age-based typical duration
    const duration =
      prediction.suggestedDuration ||
      getAgeBasedDuration(data?.babyAgeDays || null);

    // Check for in-progress sleep before creating activity
    if (inProgressSleep) {
      // Store activity data and show confirmation dialog
      setPendingActivity({
        data: {
          duration,
          feedingSource: 'direct',
          side: 'left',
        },
        type: 'nursing',
      });
      setShowSleepConfirmation(true);
      return;
    }

    setCreatingType('nursing-left');

    let tempId: string | null = null;

    try {
      const now = new Date();

      // Build nursing activity data
      const nursingData = {
        duration,
        feedingSource: 'direct' as const,
        type: 'nursing' as const,
      };

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        ...nursingData,
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: {
          side: 'left' as const,
          type: 'nursing' as const,
        },
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        id: `activity-optimistic-nursing-left-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'nursing',
        babyId,
        details: {
          side: 'left',
          type: 'nursing',
        },
        duration,
        endTime: now,
        feedingSource: 'direct',
        startTime: now,
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      // Don't await - let it invalidate in background (mutation already handles invalidation)
      utils.activities.getUpcomingFeeding.invalidate();
    } catch (err) {
      console.error('Failed to log nursing left:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log nursing. Please try again.');
    } finally {
      setCreatingType(null);
    }
  };

  const handleQuickNursingRight = async (e: React.MouseEvent) => {
    e.stopPropagation();

    // Use predicted duration if available, otherwise use age-based typical duration
    const duration =
      prediction.suggestedDuration ||
      getAgeBasedDuration(data?.babyAgeDays || null);

    // Check for in-progress sleep before creating activity
    if (inProgressSleep) {
      // Store activity data and show confirmation dialog
      setPendingActivity({
        data: {
          duration,
          feedingSource: 'direct',
          side: 'right',
        },
        type: 'nursing',
      });
      setShowSleepConfirmation(true);
      return;
    }

    setCreatingType('nursing-right');

    let tempId: string | null = null;

    try {
      const now = new Date();

      // Build nursing activity data
      const nursingData = {
        duration,
        feedingSource: 'direct' as const,
        type: 'nursing' as const,
      };

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        ...nursingData,
        amountMl: null,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: {
          side: 'right' as const,
          type: 'nursing' as const,
        },
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        id: `activity-optimistic-nursing-right-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'nursing',
        babyId,
        details: {
          side: 'right',
          type: 'nursing',
        },
        duration,
        endTime: now,
        feedingSource: 'direct',
        startTime: now,
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      // Don't await - let it invalidate in background (mutation already handles invalidation)
      utils.activities.getUpcomingFeeding.invalidate();
    } catch (err) {
      console.error('Failed to log nursing right:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log nursing. Please try again.');
    } finally {
      setCreatingType(null);
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

  const handleLastActivityClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (lastFeedingActivity) {
      setEditingActivity(lastFeedingActivity);
      setEditDrawerOpen(true);
    }
  };

  const handleEditDrawerClose = () => {
    setEditDrawerOpen(false);
    setEditingActivity(null);
  };

  const handleStopSleepAndCreate = async () => {
    if (!pendingActivity) return;

    setShowSleepConfirmation(false);
    setCreatingType(
      pendingActivity.type === 'nursing'
        ? pendingActivity.data.side === 'right'
          ? 'nursing-right'
          : 'nursing-left'
        : pendingActivity.type,
    );

    let tempId: string | null = null;

    try {
      // Stop the in-progress sleep (non-blocking)
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

      if (type === 'bottle') {
        // Build bottle activity data
        const bottleData = {
          amountMl: data.amountMl,
          feedingSource: data.feedingSource as 'formula' | 'pumped',
          type: 'bottle' as const,
        };

        // Create optimistic activity for immediate UI feedback
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
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        tempId = addOptimisticActivity(optimisticActivity);

        // Create the actual activity
        const activity = await createActivity({
          activityType: 'bottle',
          amountMl: data.amountMl,
          babyId,
          duration: 0,
          endTime: now,
          feedingSource: data.feedingSource as 'formula' | 'pumped',
          startTime: now,
        });

        if (tempId) {
          removeOptimisticActivity(tempId);
        }

        onActivityLogged?.(activity);
        utils.activities.getUpcomingFeeding.invalidate();
      } else if (type === 'nursing') {
        // Build nursing activity data
        const nursingData = {
          duration: data.duration,
          feedingSource: 'direct' as const,
          type: 'nursing' as const,
        };

        const side = data.side || 'both';

        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          ...nursingData,
          amountMl: null,
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
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        tempId = addOptimisticActivity(optimisticActivity);

        // Create the actual activity
        const activity = await createActivity({
          activityType: 'nursing',
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

        if (tempId) {
          removeOptimisticActivity(tempId);
        }

        onActivityLogged?.(activity);
        utils.activities.getUpcomingFeeding.invalidate();
      }
    } catch (err) {
      console.error(`Failed to log ${pendingActivity.type}:`, err);
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error(
        `Failed to log ${pendingActivity.type === 'bottle' ? 'bottle feeding' : 'nursing'}. Please try again.`,
      );
    } finally {
      setCreatingType(null);
      setPendingActivity(null);
    }
  };

  const handleKeepSleepingAndCreate = async () => {
    if (!pendingActivity) return;

    setShowSleepConfirmation(false);
    setCreatingType(
      pendingActivity.type === 'nursing'
        ? pendingActivity.data.side === 'right'
          ? 'nursing-right'
          : 'nursing-left'
        : pendingActivity.type,
    );

    let tempId: string | null = null;

    try {
      const now = new Date();
      const { type, data } = pendingActivity;

      if (type === 'bottle') {
        // Build bottle activity data
        const bottleData = {
          amountMl: data.amountMl,
          feedingSource: data.feedingSource as 'formula' | 'pumped',
          type: 'bottle' as const,
        };

        // Create optimistic activity for immediate UI feedback
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
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        tempId = addOptimisticActivity(optimisticActivity);

        // Create the actual activity
        const activity = await createActivity({
          activityType: 'bottle',
          amountMl: data.amountMl,
          babyId,
          duration: 0,
          endTime: now,
          feedingSource: data.feedingSource as 'formula' | 'pumped',
          startTime: now,
        });

        if (tempId) {
          removeOptimisticActivity(tempId);
        }

        onActivityLogged?.(activity);
        utils.activities.getUpcomingFeeding.invalidate();
      } else if (type === 'nursing') {
        // Build nursing activity data
        const nursingData = {
          duration: data.duration,
          feedingSource: 'direct' as const,
          type: 'nursing' as const,
        };

        const side = data.side || 'both';

        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          ...nursingData,
          amountMl: null,
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
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        tempId = addOptimisticActivity(optimisticActivity);

        // Create the actual activity
        const activity = await createActivity({
          activityType: 'nursing',
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

        if (tempId) {
          removeOptimisticActivity(tempId);
        }

        onActivityLogged?.(activity);
        utils.activities.getUpcomingFeeding.invalidate();
      }
    } catch (err) {
      console.error(`Failed to log ${pendingActivity.type}:`, err);
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error(
        `Failed to log ${pendingActivity.type === 'bottle' ? 'bottle feeding' : 'nursing'}. Please try again.`,
      );
    } finally {
      setCreatingType(null);
      setPendingActivity(null);
    }
  };

  const feedingTheme = getActivityTheme('feeding');
  const FeedingIcon = feedingTheme.icon;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 border-0 col-span-2',
          `bg-${feedingTheme.color} ${feedingTheme.textColor}`,
        )}
      >
        <div className="flex flex-col gap-6">
          <PredictiveCardHeader
            icon={FeedingIcon}
            isFetching={isFetching && !isLoading}
            onAddClick={handleAddClick}
            onInfoClick={handleInfoClick}
            onStatsClick={handleStatsClick}
            quickLogEnabled={false}
            showAddIcon={true}
            showStatsIcon={userData?.showActivityGoals ?? true}
            title="Feeding"
          />

          <PredictiveProgressTrack
            endLabel={feedingEndLabel ?? undefined}
            progressPercent={feedingProgress?.percentage}
            srLabel={feedingProgress?.srLabel}
            startLabel={feedingStartLabel ?? undefined}
          />

          <div className="flex items-start justify-between px-2">
            {/* Left Column: Last Feeding */}
            {lastTimeDistance && lastExactTime && lastFeedingActivity ? (
              <button
                className="space-y-1.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLastActivityClick}
                type="button"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const ActivityIcon = getActivityIcon(
                      lastFeedingActivity.type,
                    );
                    return (
                      <ActivityIcon className="size-4 shrink-0 opacity-90" />
                    );
                  })()}
                  <span className="text-lg font-semibold leading-tight">
                    {lastTimeDistance} ago
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm opacity-70 leading-tight">
                  <span>
                    {lastExactTime}
                    {lastFeedingActivity.type === 'bottle' &&
                      lastFeedingActivity.amountMl && (
                        <> • {formatAmount(lastFeedingActivity.amountMl)}</>
                      )}
                    {lastFeedingActivity.type === 'nursing' &&
                      lastFeedingActivity.duration &&
                      (() => {
                        const details = lastFeedingActivity.details as
                          | { side?: 'left' | 'right' | 'both' }
                          | null
                          | undefined;
                        const side = details?.side;
                        return (
                          <>
                            {' • '}
                            {lastFeedingActivity.duration} min
                            {side && side !== 'both' && (
                              <> ({side === 'left' ? 'L' : 'R'})</>
                            )}
                          </>
                        );
                      })()}
                  </span>
                  {lastFeedingUser && (
                    <Avatar className="size-4 shrink-0">
                      <AvatarImage
                        alt={lastFeedingUser.name}
                        src={lastFeedingUser.avatar || ''}
                      />
                      <AvatarFallback className="text-[9px]">
                        {lastFeedingUser.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </button>
            ) : (
              <div className="space-y-1">
                <div className="text-sm opacity-60">No recent feeding</div>
              </div>
            )}

            {/* Right Column: Next Feeding */}
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
                {' • '}
                {formatAmount(
                  prediction.suggestedAmount ||
                    getAgeBasedAmount(data?.babyAgeDays || null),
                )}
              </div>
            </button>
          </div>

          <FeedingActionButtons
            creatingType={creatingType}
            feedingTheme={feedingTheme}
            onBottleClick={handleQuickBottle}
            onNursingLeftClick={handleQuickNursingLeft}
            onNursingRightClick={handleQuickNursingRight}
            suggestedAmount={
              formatAmount(
                prediction.suggestedAmount ||
                  getAgeBasedAmount(data?.babyAgeDays || null),
              ) || '4oz'
            }
            suggestedDuration={
              prediction.suggestedDuration ||
              getAgeBasedDuration(data?.babyAgeDays || null)
            }
          />
        </div>
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="feeding"
        babyAgeDays={data.babyAgeDays}
        babyId={babyId}
        customPreferences={queryData?.customPreferences}
        learningContent={getFeedingLearningContent(
          data.babyAgeDays ?? 0,
          baby?.firstName || undefined,
        )}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        timeFormat={timeFormat}
        title="About Feeding Predictions"
        unit={userUnitPref}
      />

      {/* Stats Drawer */}
      <FeedingStatsDrawer
        activities={allActivities ?? []}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        recentActivities={
          data.recentActivities.map((item) => ({
            amountMl: item.amountMl ?? undefined,
            time: new Date(item.startTime),
          })) ?? []
        }
        timeFormat={timeFormat}
        unit={userUnitPref}
      />

      {/* Sleep Stop Confirmation Dialog */}
      <StopSleepConfirmationDialog
        onKeepSleeping={handleKeepSleepingAndCreate}
        onOpenChange={setShowSleepConfirmation}
        onStopSleep={handleStopSleepAndCreate}
        open={showSleepConfirmation}
        sleepDuration={sleepDuration}
      />

      {/* Edit Drawer */}
      {editingActivity &&
        (editingActivity.type === 'feeding' ||
          editingActivity.type === 'nursing' ||
          editingActivity.type === 'bottle' ||
          editingActivity.type === 'solids') &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={handleEditDrawerClose}
            title="Edit Feeding"
          >
            <TimelineFeedingDrawer
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
