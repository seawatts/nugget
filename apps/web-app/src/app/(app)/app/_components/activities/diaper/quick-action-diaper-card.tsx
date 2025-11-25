'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { toast } from '@nugget/ui/sonner';
import { formatDistanceToNow } from 'date-fns';
import { Baby, Droplet, Droplets } from 'lucide-react';
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
import { getDiaperDailyProgress } from '../shared/daily-progress';
import { useInProgressSleep } from '../shared/hooks/use-in-progress-sleep';
import { autoStopInProgressSleepAction } from '../sleep/actions';
import { useActivityMutations } from '../use-activity-mutations';
import { DiaperStatsDrawer } from './components';
import { getDiaperLearningContent } from './learning-content';
import { predictNextDiaper } from './prediction';
import { TimelineDiaperDrawer } from './timeline-diaper-drawer';

interface QuickActionDiaperCardProps {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  onOpenDrawer?: () => void;
}

/**
 * Format diaper type for display
 */
function formatDiaperType(type: string | null): string {
  if (!type) return '';
  if (type === 'both') return 'Both';
  if (type === 'wet') return 'Pee';
  if (type === 'dirty') return 'Poop';
  return type.charAt(0).toUpperCase() + type.slice(1);
}

/**
 * Get icon component for diaper type
 */
function getDiaperTypeIcon(type: string | null) {
  if (type === 'wet') return Droplet;
  if (type === 'dirty') return Droplets;
  if (type === 'both') return Baby;
  return Baby; // Default fallback
}

export function QuickActionDiaperCard({
  onActivityLogged,
  onOpenDrawer,
}: QuickActionDiaperCardProps) {
  const params = useParams();
  const babyId = params.babyId as string;

  // Get shared data from dashboard store (populated by DashboardContainer)
  const userData = useDashboardDataStore.use.user();
  const allActivities = useDashboardDataStore.use.activities();
  const baby = useDashboardDataStore.use.baby();

  const timeFormat = userData?.timeFormat || '12h';

  // Get optimistic activities from store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Use tRPC query for prediction data
  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = api.activities.getUpcomingDiaper.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [creatingType, setCreatingType] = useState<
    'wet' | 'dirty' | 'both' | null
  >(null);
  const [showSleepConfirmation, setShowSleepConfirmation] = useState(false);
  const [pendingActivity, setPendingActivity] = useState<{
    type: 'wet' | 'dirty' | 'both';
  } | null>(null);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

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

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        babyBirthDate: queryData.babyBirthDate,
        prediction: predictNextDiaper(
          [...optimisticActivities, ...queryData.recentActivities].filter(
            (a) => a.type === 'diaper',
          ),
          queryData.babyBirthDate,
          mergedActivities,
        ),
        recentActivities: queryData.recentActivities,
      }
    : null;

  const diaperProgress = useMemo(
    () =>
      getDiaperDailyProgress({
        activities: mergedActivities,
        babyAgeDays: data?.babyAgeDays ?? null,
        dataPointsCount:
          data?.prediction?.calculationDetails?.dataPoints ?? undefined,
        predictedIntervalHours: data?.prediction?.intervalHours,
      }),
    [
      data?.babyAgeDays,
      mergedActivities,
      data?.prediction?.calculationDetails?.dataPoints,
      data?.prediction?.intervalHours,
    ],
  );

  const diaperStartLabel =
    typeof diaperProgress?.currentValue === 'number'
      ? `${diaperProgress.currentValue} Today`
      : typeof diaperProgress?.goalValue === 'number'
        ? '0 Today'
        : null;
  const diaperEndLabel =
    typeof diaperProgress?.goalValue === 'number'
      ? `Goal ${diaperProgress.goalValue}`
      : null;

  // Find the most recent diaper activity with user info
  const lastDiaperActivity = useMemo(() => {
    if (!queryData?.recentActivities) return null;

    return queryData.recentActivities.find(
      (a) =>
        a.type === 'diaper' &&
        !a.isScheduled &&
        !(a.details && 'skipped' in a.details && a.details.skipped === true),
    );
  }, [queryData?.recentActivities]);

  // Get user info from last diaper
  const lastDiaperUser = lastDiaperActivity?.user
    ? {
        avatar: lastDiaperActivity.user.avatarUrl,
        initials: (
          lastDiaperActivity.user.firstName?.[0] ||
          lastDiaperActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [lastDiaperActivity.user.firstName, lastDiaperActivity.user.lastName]
            .filter(Boolean)
            .join(' ') || lastDiaperActivity.user.email,
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
    return <PredictiveCardSkeleton activityType="diaper" />;
  }

  if (!data) return null;

  const { prediction } = data;

  // Determine most common diaper type
  // const mostCommonDiaperType = getMostCommonDiaperType(allActivities || []);

  // Format time displays
  const nextTimeDistance = formatDistanceToNow(prediction.nextDiaperTime, {
    addSuffix: false,
  }).replace(/^about /, '');
  const nextExactTime = formatTimeWithPreference(
    prediction.nextDiaperTime,
    timeFormat,
  );

  const lastTimeDistance = prediction.lastDiaperTime
    ? formatDistanceToNow(prediction.lastDiaperTime, {
        addSuffix: false,
      }).replace(/^about /, '')
    : null;
  const lastExactTime = prediction.lastDiaperTime
    ? formatTimeWithPreference(prediction.lastDiaperTime, timeFormat)
    : null;

  const handleQuickDiaper = async (
    e: React.MouseEvent,
    type: 'wet' | 'dirty' | 'both',
  ) => {
    e.stopPropagation();

    // Check for in-progress sleep before creating activity
    if (inProgressSleep) {
      // Store activity data and show confirmation dialog
      setPendingActivity({ type });
      setShowSleepConfirmation(true);
      return;
    }

    setCreatingType(type);

    let tempId: string | null = null;

    try {
      const now = new Date();

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
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'diaper',
        babyId,
        details: { type },
        endTime: now,
        startTime: now,
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      // Don't await - let it invalidate in background (mutation already handles invalidation)
      utils.activities.getUpcomingDiaper.invalidate();
    } catch (err) {
      console.error('Failed to log diaper change:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log diaper change. Please try again.');
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
    if (lastDiaperActivity) {
      setEditingActivity(lastDiaperActivity);
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
    setCreatingType(pendingActivity.type);

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
      const { type } = pendingActivity;

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
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'diaper',
        babyId,
        details: { type },
        endTime: now,
        startTime: now,
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      utils.activities.getUpcomingDiaper.invalidate();
    } catch (err) {
      console.error('Failed to log diaper change:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log diaper change. Please try again.');
    } finally {
      setCreatingType(null);
      setPendingActivity(null);
    }
  };

  const handleKeepSleepingAndCreate = async () => {
    if (!pendingActivity) return;

    setShowSleepConfirmation(false);
    setCreatingType(pendingActivity.type);

    let tempId: string | null = null;

    try {
      const now = new Date();
      const { type } = pendingActivity;

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
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'diaper',
        babyId,
        details: { type },
        endTime: now,
        startTime: now,
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      utils.activities.getUpcomingDiaper.invalidate();
    } catch (err) {
      console.error('Failed to log diaper change:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log diaper change. Please try again.');
    } finally {
      setCreatingType(null);
      setPendingActivity(null);
    }
  };

  const diaperTheme = getActivityTheme('diaper');
  const DiaperIcon = diaperTheme.icon;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 border-0 col-span-2',
          `bg-${diaperTheme.color} ${diaperTheme.textColor}`,
        )}
      >
        <div className="flex flex-col gap-4">
          <PredictiveCardHeader
            icon={DiaperIcon}
            isFetching={isFetching && !isLoading}
            onAddClick={handleAddClick}
            onInfoClick={handleInfoClick}
            onStatsClick={handleStatsClick}
            quickLogEnabled={false}
            showAddIcon={true}
            showStatsIcon={userData?.showActivityGoals ?? true}
            title="Diaper"
          />

          <PredictiveProgressTrack
            endLabel={diaperEndLabel ?? undefined}
            progressPercent={diaperProgress?.percentage}
            srLabel={diaperProgress?.srLabel}
            startLabel={diaperStartLabel ?? undefined}
          />

          <div className="flex items-start justify-between px-2">
            {lastTimeDistance && lastExactTime && lastDiaperActivity ? (
              <button
                className="space-y-1.5 text-left cursor-pointer hover:opacity-80 transition-opacity"
                onClick={handleLastActivityClick}
                type="button"
              >
                <div className="flex items-center gap-2">
                  {(() => {
                    const DiaperTypeIcon = getDiaperTypeIcon(
                      lastDiaperActivity.details?.type as string | null,
                    );
                    return (
                      <DiaperTypeIcon className="size-4 shrink-0 opacity-90" />
                    );
                  })()}
                  <span className="text-lg font-semibold leading-tight">
                    {lastTimeDistance} ago
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm opacity-70 leading-tight">
                  <span>
                    {lastExactTime}
                    {lastDiaperActivity.details?.type && (
                      <>
                        {' '}
                        •{' '}
                        {formatDiaperType(
                          lastDiaperActivity.details.type as string,
                        )}
                      </>
                    )}
                  </span>
                  {lastDiaperUser && (
                    <Avatar className="size-4 shrink-0">
                      <AvatarImage
                        alt={lastDiaperUser.name}
                        src={lastDiaperUser.avatar || ''}
                      />
                      <AvatarFallback className="text-[9px]">
                        {lastDiaperUser.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </button>
            ) : (
              <div className="space-y-1">
                <div className="text-sm opacity-60">No recent change</div>
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
                {prediction.suggestedType && (
                  <>
                    {' • '}
                    {formatDiaperType(prediction.suggestedType)}
                  </>
                )}
              </div>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <Button
              className={cn(
                'flex flex-col items-center justify-center h-auto py-3 gap-1',
                'bg-white/20 hover:bg-white/30 active:bg-white/40',
                diaperTheme.textColor,
              )}
              disabled={creatingType !== null}
              onClick={(e) => handleQuickDiaper(e, 'wet')}
              variant="ghost"
            >
              {creatingType === 'wet' ? (
                <Icons.Spinner className="size-5" />
              ) : (
                <Droplet className="size-5" />
              )}
              <span className="text-xs font-medium">Pee</span>
            </Button>

            <Button
              className={cn(
                'flex flex-col items-center justify-center h-auto py-3 gap-1',
                'bg-white/20 hover:bg-white/30 active:bg-white/40',
                diaperTheme.textColor,
              )}
              disabled={creatingType !== null}
              onClick={(e) => handleQuickDiaper(e, 'dirty')}
              variant="ghost"
            >
              {creatingType === 'dirty' ? (
                <Icons.Spinner className="size-5" />
              ) : (
                <Droplets className="size-5" />
              )}
              <span className="text-xs font-medium">Poop</span>
            </Button>

            <Button
              className={cn(
                'flex flex-col items-center justify-center h-auto py-3 gap-1',
                'bg-white/20 hover:bg-white/30 active:bg-white/40',
                diaperTheme.textColor,
              )}
              disabled={creatingType !== null}
              onClick={(e) => handleQuickDiaper(e, 'both')}
              variant="ghost"
            >
              {creatingType === 'both' ? (
                <Icons.Spinner className="size-5" />
              ) : (
                <Baby className="size-5" />
              )}
              <span className="text-xs font-medium">Both</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="diaper"
        babyAgeDays={data.babyAgeDays}
        learningContent={getDiaperLearningContent(
          data.babyAgeDays ?? 0,
          baby?.firstName || undefined,
        )}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        timeFormat={timeFormat}
        title="About Diaper Predictions"
      />

      {/* Stats Drawer */}
      <DiaperStatsDrawer
        activities={allActivities ?? []}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        recentActivities={
          data.recentActivities
            .filter((item) => item.type === 'diaper')
            .map((item) => ({
              time: new Date(item.startTime),
              type: (item.details?.type ?? undefined) as
                | 'both'
                | 'wet'
                | 'dirty'
                | undefined,
            })) ?? []
        }
        timeFormat={timeFormat}
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
        (editingActivity.type === 'diaper' ||
          editingActivity.type === 'wet' ||
          editingActivity.type === 'dirty' ||
          editingActivity.type === 'both') &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={handleEditDrawerClose}
            title="Edit Diaper"
          >
            <TimelineDiaperDrawer
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
