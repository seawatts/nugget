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
import { formatVolumeDisplay, getVolumeUnit } from '../shared/volume-utils';
import { useActivityMutations } from '../use-activity-mutations';
import { FeedingStatsDrawer } from './components';
import { getFeedingLearningContent } from './learning-content';
import { predictNextFeeding } from './prediction';

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
  const [creatingType, setCreatingType] = useState<'bottle' | 'nursing' | null>(
    null,
  );

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
        prediction: predictNextFeeding(
          [...optimisticActivities, ...queryData.recentActivities],
          queryData.babyBirthDate,
          queryData.feedIntervalHours,
        ),
        recentActivities: queryData.recentActivities,
      }
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
    setCreatingType('bottle');

    let tempId: string | null = null;

    try {
      const now = new Date();

      // Use predicted amount if available, otherwise fall back to age-based amount
      const amountMl =
        prediction.suggestedAmount ||
        getAgeBasedAmount(data?.babyAgeDays || null);

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

  const handleQuickNursing = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setCreatingType('nursing');

    let tempId: string | null = null;

    try {
      const now = new Date();
      // Use predicted duration if available, otherwise use age-based typical duration
      const duration =
        prediction.suggestedDuration ||
        getAgeBasedDuration(data?.babyAgeDays || null);

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
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Store the tempId returned by addOptimisticActivity
      tempId = addOptimisticActivity(optimisticActivity);

      // Create the actual activity
      const activity = await createActivity({
        activityType: 'nursing',
        babyId,
        details: {
          side: 'both',
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
      console.error('Failed to log nursing:', err);
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
            {/* Left Column: Last Feeding */}
            {lastTimeDistance && lastExactTime && lastFeedingActivity ? (
              <div className="space-y-1.5">
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
                      lastFeedingActivity.duration && (
                        <> • {lastFeedingActivity.duration} min</>
                      )}
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
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm opacity-60">No recent feeding</div>
              </div>
            )}

            {/* Right Column: Next Feeding */}
            <div className="space-y-1">
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
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-2 gap-2 mt-4">
          <Button
            className={cn(
              'flex flex-col items-center justify-center h-auto py-3 gap-1',
              'bg-white/20 hover:bg-white/30 active:bg-white/40',
              feedingTheme.textColor,
            )}
            disabled={creatingType !== null}
            onClick={handleQuickBottle}
            variant="ghost"
          >
            {creatingType === 'bottle' ? (
              <Icons.Spinner className="size-5" />
            ) : (
              <Milk className="size-5" />
            )}
            <span className="text-xs font-medium">Bottle</span>
            <span className="text-xs opacity-80">
              (
              {formatAmount(
                prediction.suggestedAmount ||
                  getAgeBasedAmount(data?.babyAgeDays || null),
              )}
              )
            </span>
          </Button>

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
            <span className="text-xs opacity-80">
              (
              {prediction.suggestedDuration ||
                getAgeBasedDuration(data?.babyAgeDays || null)}{' '}
              min)
            </span>
          </Button>
        </div>
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="feeding"
        babyAgeDays={data.babyAgeDays}
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
    </>
  );
}
