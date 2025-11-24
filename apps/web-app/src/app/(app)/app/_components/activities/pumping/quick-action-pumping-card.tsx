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
import { Droplets } from 'lucide-react';
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
import { formatVolumeDisplay, getVolumeUnit } from '../shared/volume-utils';
import { useActivityMutations } from '../use-activity-mutations';
import { PumpingStatsDrawer } from './components';
import { getPumpingLearningContent } from './learning-content';
import { predictNextPumping } from './prediction';
import { calculatePumpingTrendData } from './pumping-goals';
import { getAgeBasedPumpingAmounts } from './pumping-volume-utils';

interface QuickActionPumpingCardProps {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
  onOpenDrawer?: () => void;
}

export function QuickActionPumpingCard({
  onActivityLogged,
  onOpenDrawer,
}: QuickActionPumpingCardProps) {
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

  // Use tRPC query for prediction data
  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = api.activities.getUpcomingPumping.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [creatingAmount, setCreatingAmount] = useState<
    'low' | 'medium' | 'high' | null
  >(null);

  const { createActivity } = useActivityMutations();
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
        prediction: predictNextPumping(
          [...optimisticActivities, ...queryData.recentActivities],
          queryData.babyBirthDate,
        ),
        recentActivities: queryData.recentActivities,
      }
    : null;

  // Find the most recent pumping activity with user info
  const lastPumpingActivity = useMemo(() => {
    if (!queryData?.recentActivities) return null;

    return queryData.recentActivities.find(
      (a) =>
        a.type === 'pumping' &&
        !a.isScheduled &&
        !(a.details && 'skipped' in a.details && a.details.skipped === true),
    );
  }, [queryData?.recentActivities]);

  // Get user info from last pumping
  const lastPumpingUser = lastPumpingActivity?.user
    ? {
        avatar: lastPumpingActivity.user.avatarUrl,
        initials: (
          lastPumpingActivity.user.firstName?.[0] ||
          lastPumpingActivity.user.email[0] ||
          '?'
        ).toUpperCase(),
        name:
          [
            lastPumpingActivity.user.firstName,
            lastPumpingActivity.user.lastName,
          ]
            .filter(Boolean)
            .join(' ') || lastPumpingActivity.user.email,
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
    return <PredictiveCardSkeleton activityType="pumping" />;
  }

  if (!data) return null;

  const { prediction } = data;

  // Get age-based amounts for the three buttons
  const amounts = getAgeBasedPumpingAmounts(data.babyAgeDays);

  // Format amount for display based on user preference
  const formatAmount = (ml: number | null) => {
    if (!ml) return null;
    return formatVolumeDisplay(ml, userUnitPref, true);
  };

  // Format time displays
  const nextTimeDistance = formatDistanceToNow(prediction.nextPumpingTime, {
    addSuffix: false,
  });

  // Calculate stats for drawer
  const pumpingTrendData = allActivities
    ? calculatePumpingTrendData(allActivities)
    : [];
  const nextExactTime = formatTimeWithPreference(
    prediction.nextPumpingTime,
    timeFormat,
  );

  const lastTimeDistance = prediction.lastPumpingTime
    ? formatDistanceToNow(prediction.lastPumpingTime, { addSuffix: false })
    : null;
  const lastExactTime = prediction.lastPumpingTime
    ? formatTimeWithPreference(prediction.lastPumpingTime, timeFormat)
    : null;

  const handleQuickPump = async (
    e: React.MouseEvent,
    amountType: 'low' | 'medium' | 'high',
  ) => {
    e.stopPropagation();
    setCreatingAmount(amountType);

    let tempId: string | null = null;

    try {
      const now = new Date();

      // Get the selected amount based on button clicked
      const totalAmountMl = amounts[amountType];

      // Split equally between left and right breasts
      const leftAmountMl = Math.round(totalAmountMl / 2);
      const rightAmountMl = Math.round(totalAmountMl / 2);

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amountMl: totalAmountMl,
        assignedUserId: null,
        babyId: babyId,
        createdAt: now,
        details: {
          leftBreastMl: leftAmountMl,
          rightBreastMl: rightAmountMl,
          type: 'pumping' as const,
        },
        duration: 0,
        endTime: now,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `activity-optimistic-pumping-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        type: 'pumping' as const,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'pumping',
        amountMl: totalAmountMl,
        babyId,
        details: {
          leftBreastMl: leftAmountMl,
          rightBreastMl: rightAmountMl,
          type: 'pumping',
        },
        duration: 0,
        endTime: now,
        startTime: now,
      });

      // Remove optimistic activity after real one is created
      if (tempId) {
        removeOptimisticActivity(tempId);
      }

      onActivityLogged?.(activity);
      // Don't await - let it invalidate in background (mutation already handles invalidation)
      utils.activities.getUpcomingPumping.invalidate();
    } catch (err) {
      console.error('Failed to log pumping session:', err);
      // Remove optimistic activity on error to avoid stuck state
      if (tempId) {
        removeOptimisticActivity(tempId);
      }
      toast.error('Failed to log pumping session. Please try again.');
    } finally {
      setCreatingAmount(null);
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

  const pumpingTheme = getActivityTheme('pumping');
  const PumpingIcon = pumpingTheme.icon;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 border-0 col-span-2',
          `bg-${pumpingTheme.color} ${pumpingTheme.textColor}`,
        )}
      >
        <PredictiveCardHeader
          icon={PumpingIcon}
          isFetching={isFetching && !isLoading}
          onAddClick={handleAddClick}
          onInfoClick={handleInfoClick}
          onStatsClick={handleStatsClick}
          quickLogEnabled={false}
          showAddIcon={true}
          showStatsIcon={userData?.showActivityGoals ?? true}
          title="Pumping"
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
            {/* Left Column: Last Pumping */}
            {lastTimeDistance && lastExactTime && lastPumpingActivity ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Droplets className="size-4 shrink-0 opacity-90" />
                  <span className="text-lg font-semibold leading-tight">
                    {lastTimeDistance} ago
                  </span>
                </div>
                <div className="flex items-center gap-1.5 text-sm opacity-70 leading-tight">
                  <span>
                    {lastExactTime}
                    {lastPumpingActivity.amountMl && (
                      <> • {formatAmount(lastPumpingActivity.amountMl)}</>
                    )}
                  </span>
                  {lastPumpingUser && (
                    <Avatar className="size-4 shrink-0">
                      <AvatarImage
                        alt={lastPumpingUser.name}
                        src={lastPumpingUser.avatar || ''}
                      />
                      <AvatarFallback className="text-[9px]">
                        {lastPumpingUser.initials}
                      </AvatarFallback>
                    </Avatar>
                  )}
                </div>
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm opacity-60">No recent pumping</div>
              </div>
            )}

            {/* Right Column: Next Pumping */}
            <div className="space-y-1">
              <div className="text-lg font-semibold leading-tight">
                In {nextTimeDistance}
              </div>
              <div className="text-sm opacity-70 leading-tight">
                {nextExactTime}
                {' • '}
                {formatAmount(amounts.medium)}
              </div>
            </div>
          </div>
        </div>

        {/* Quick Action Buttons - 3 Amount Options */}
        <div className="grid grid-cols-3 gap-2 mt-4">
          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              pumpingTheme.textColor,
            )}
            disabled={creatingAmount !== null}
            onClick={(e) => handleQuickPump(e, 'low')}
            variant="ghost"
          >
            {creatingAmount === 'low' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Droplets className="size-5" />
            )}
            <span className="text-xs font-medium">
              {formatAmount(amounts.low)}
            </span>
          </Button>

          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              pumpingTheme.textColor,
            )}
            disabled={creatingAmount !== null}
            onClick={(e) => handleQuickPump(e, 'medium')}
            variant="ghost"
          >
            {creatingAmount === 'medium' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Droplets className="size-5" />
            )}
            <span className="text-xs font-medium">
              {formatAmount(amounts.medium)}
            </span>
          </Button>

          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              pumpingTheme.textColor,
            )}
            disabled={creatingAmount !== null}
            onClick={handleAddClick}
            variant="ghost"
          >
            <Droplets className="size-5" />
            <span className="text-xs font-medium">Custom Amount</span>
          </Button>
        </div>
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="pumping"
        babyAgeDays={data.babyAgeDays}
        learningContent={getPumpingLearningContent(
          data.babyAgeDays ?? 0,
          baby?.firstName || undefined,
        )}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        timeFormat={timeFormat}
        title="About Pumping Predictions"
        unit={userUnitPref}
      />

      {/* Stats Drawer */}
      <PumpingStatsDrawer
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
        trendData={pumpingTrendData}
        unit={userUnitPref}
      />
    </>
  );
}
