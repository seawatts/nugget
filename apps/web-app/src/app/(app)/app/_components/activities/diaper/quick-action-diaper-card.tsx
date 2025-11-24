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
import { useActivityMutations } from '../use-activity-mutations';
import { DiaperStatsDrawer } from './components';
import { getDiaperLearningContent } from './learning-content';
import { predictNextDiaper } from './prediction';

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

  const { createActivity } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );
  const removeOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.removeActivity,
  );
  const utils = api.useUtils();

  // Merge optimistic and recent activities
  const mergedActivities = queryData
    ? [...optimisticActivities, ...queryData.recentActivities]
    : [];

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        babyBirthDate: queryData.babyBirthDate,
        prediction: predictNextDiaper(
          mergedActivities.filter((a) => a.type === 'diaper'),
          queryData.babyBirthDate,
          mergedActivities,
        ),
        recentActivities: queryData.recentActivities,
      }
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
  });
  const nextExactTime = formatTimeWithPreference(
    prediction.nextDiaperTime,
    timeFormat,
  );

  const lastTimeDistance = prediction.lastDiaperTime
    ? formatDistanceToNow(prediction.lastDiaperTime, { addSuffix: false })
    : null;
  const lastExactTime = prediction.lastDiaperTime
    ? formatTimeWithPreference(prediction.lastDiaperTime, timeFormat)
    : null;

  const handleQuickDiaper = async (
    e: React.MouseEvent,
    type: 'wet' | 'dirty' | 'both',
  ) => {
    e.stopPropagation();
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
            {/* Left Column: Last Diaper */}
            {lastTimeDistance && lastExactTime && lastDiaperActivity ? (
              <div className="space-y-1.5">
                <div className="flex items-center gap-2">
                  <Baby className="size-4 shrink-0 opacity-90" />
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
              </div>
            ) : (
              <div className="space-y-1">
                <div className="text-sm opacity-60">No recent change</div>
              </div>
            )}

            {/* Right Column: Next Diaper */}
            <div className="space-y-1">
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
            </div>
          </div>
        </div>

        {/* Quick Action Buttons */}
        <div className="grid grid-cols-3 gap-2 mt-4">
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
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="diaper"
        babyAgeDays={data.babyAgeDays}
        learningContent={getDiaperLearningContent(
          data.babyAgeDays ?? 0,
          baby?.name || undefined,
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
        trendData={[]}
      />
    </>
  );
}
