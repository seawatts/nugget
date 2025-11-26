'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Skeleton } from '@nugget/ui/components/skeleton';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { Baby, BarChart3, Info, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import {
  PredictiveCardSkeleton,
  PredictiveInfoDrawer,
  PredictiveOverdueActions,
  usePredictiveActions,
} from '../shared/components/predictive-cards';
import { skipDiaperAction } from './actions';
import { DiaperStatsDrawer } from './components';
import { DiaperGoalDisplay } from './components/diaper-goal-display';
import {
  calculateTodaysDiaperStats,
  getDailyDiaperGoal,
  getDailyDirtyDiaperGoal,
  getDailyWetDiaperGoal,
} from './diaper-goals';
import { getDiaperGuidanceByAge } from './diaper-intervals';
import { getDiaperLearningContent } from './learning-content';
import { predictNextDiaper } from './prediction';

interface PredictiveDiaperCardProps {
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveDiaperCard({
  onCardClick,
  onActivityLogged: _onActivityLogged,
}: PredictiveDiaperCardProps) {
  const params = useParams<{ babyId: string }>();
  const babyId = params.babyId;

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
  } = api.activities.getUpcomingDiaper.useQuery(
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

  // Merge optimistic and recent activities
  const mergedActivities = queryData
    ? [...optimisticActivities, ...queryData.recentActivities]
    : [];

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        guidanceMessage:
          queryData.babyAgeDays !== null
            ? getDiaperGuidanceByAge(queryData.babyAgeDays)
            : 'Check diaper regularly and change when wet or soiled.',
        prediction: predictNextDiaper(
          // Merge optimistic activities with recent activities for accurate predictions
          mergedActivities.filter((a) => a.type === 'diaper'),
          queryData.babyBirthDate,
          mergedActivities,
        ),
      }
    : null;

  const error = queryError?.message || null;

  // Build smart defaults for quick log
  const defaultQuickLogData: Record<string, unknown> = {};
  if (
    (userData?.quickLogDiaperUsePredictedType ?? true) &&
    data?.prediction.suggestedType
  ) {
    defaultQuickLogData.details = { type: data.prediction.suggestedType };
  }

  // Use shared actions hook with diaper defaults
  const { handleQuickLog, handleSkip, isCreating, isSkipping } =
    usePredictiveActions({
      activityType: 'diaper',
      babyId,
      defaultQuickLogData,
      onActivityLogged: _onActivityLogged,
      skipAction: skipDiaperAction,
    });

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

  const { prediction, babyAgeDays } = data;

  // Calculate today's diaper statistics for goal display
  const todaysStats = calculateTodaysDiaperStats(todaysActivitiesData ?? []);
  const dailyDiaperGoal = getDailyDiaperGoal(
    babyAgeDays ?? 0,
    prediction.averageIntervalHours,
    prediction.calculationDetails.dataPoints,
  );
  const dailyWetGoal = getDailyWetDiaperGoal(
    babyAgeDays ?? 0,
    prediction.averageIntervalHours,
    prediction.calculationDetails.dataPoints,
  );
  const dailyDirtyGoal = getDailyDirtyDiaperGoal(babyAgeDays ?? 0);

  // Check if we should suppress overdue state due to recent skip (from DB)
  const isRecentlySkipped = prediction.recentSkipTime
    ? Date.now() - new Date(prediction.recentSkipTime).getTime() <
      prediction.intervalHours * 60 * 60 * 1000
    : false;
  const effectiveIsOverdue =
    prediction.isOverdue &&
    !isRecentlySkipped &&
    (userData?.showPredictiveTimes ?? true);

  // Calculate display time - if recently skipped, show next predicted time from skip moment
  const displayNextTime =
    isRecentlySkipped && prediction.recentSkipTime
      ? new Date(
          new Date(prediction.recentSkipTime).getTime() +
            prediction.intervalHours * 60 * 60 * 1000,
        )
      : prediction.nextDiaperTime;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null
      ? getDiaperLearningContent(babyAgeDays, baby?.firstName || undefined)
      : null;

  // Build quick log settings for info drawer
  const quickLogSettings = {
    activeSettings: [
      ...((userData?.quickLogDiaperUsePredictedType ?? true)
        ? ['Predicted type']
        : []),
    ],
    enabled: userData?.quickLogEnabled ?? true,
  };

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  }).replace(/^in about /, 'in ');
  const exactTime = formatTimeWithPreference(displayNextTime, timeFormat);

  // Format overdue time
  const formatOverdueTime = (minutes: number) => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      return mins > 0
        ? `${hours}h ${mins}m`
        : `${hours} hour${hours !== 1 ? 's' : ''}`;
    }
    return `${minutes} min`;
  };

  // Format diaper type
  const formatDiaperType = (type: string | null) => {
    if (!type) return '';
    if (type === 'both') return 'Both';
    if (type === 'wet') return 'Pee';
    if (type === 'dirty') return 'Poop';
    return type.charAt(0).toUpperCase() + type.slice(1);
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
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

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-activity-diaper text-activity-diaper-foreground',
          effectiveIsOverdue
            ? 'border-4 border-dashed border-amber-500'
            : 'border-0',
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4 min-w-0 overflow-hidden">
          <div className="opacity-30 shrink-0">
            <Baby className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Diaper</h2>
              <div className="flex items-center gap-1">
                {isFetching && !isLoading && (
                  <Icons.Spinner
                    className="animate-spin opacity-70"
                    size="xs"
                  />
                )}
                {(userData?.quickLogEnabled ?? true) && (
                  <button
                    className="p-1.5 rounded-full hover:bg-white/10 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    disabled={isCreating}
                    onClick={handleQuickLog}
                    title="Quick log with smart defaults"
                    type="button"
                  >
                    {isCreating ? (
                      <Icons.Spinner className="animate-spin opacity-70 size-5" />
                    ) : (
                      <Zap className="size-5 opacity-70" />
                    )}
                  </button>
                )}
                <button
                  className="p-1.5 rounded-full hover:bg-black/10 transition-colors"
                  onClick={handleStatsClick}
                  title="View statistics"
                  type="button"
                >
                  <BarChart3 className="size-5 opacity-70" />
                </button>
                <button
                  className="p-1.5 rounded-full hover:bg-black/10 transition-colors -mr-1.5"
                  onClick={handleInfoClick}
                  type="button"
                >
                  <Info className="size-5 opacity-70" />
                </button>
              </div>
            </div>
            <div className="space-y-1">
              {isLoading ? (
                // Show skeleton only on time text during initial load
                <>
                  <Skeleton className="h-6 w-48 bg-current/20" />
                  <Skeleton className="h-4 w-32 bg-current/20" />
                </>
              ) : effectiveIsOverdue ? (
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastDiaperTime && (
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-lg font-semibold shrink-0">
                        {formatDistanceToNow(prediction.lastDiaperTime, {
                          addSuffix: true,
                        }).replace(/^about /, '')}
                      </span>
                      <span className="text-sm opacity-70 truncate min-w-0">
                        {formatTimeWithPreference(
                          prediction.lastDiaperTime,
                          timeFormat,
                        )}
                        {prediction.lastDiaperType && (
                          <span>
                            {' '}
                            • {formatDiaperType(prediction.lastDiaperType)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Bottom: Next prediction with overdue indicator */}
                  {(userData?.showPredictiveTimes ?? true) && (
                    <div className="text-sm opacity-60 wrap-break-word">
                      Next {exactTime}
                      {prediction.overdueMinutes && (
                        <span className="text-amber-400 font-medium">
                          {' '}
                          • {formatOverdueTime(prediction.overdueMinutes)}{' '}
                          overdue
                        </span>
                      )}
                    </div>
                  )}
                </>
              ) : (
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastDiaperTime && (
                    <div className="flex items-baseline gap-2 min-w-0">
                      <span className="text-lg font-semibold shrink-0">
                        {formatDistanceToNow(prediction.lastDiaperTime, {
                          addSuffix: true,
                        }).replace(/^about /, '')}
                      </span>
                      <span className="text-sm opacity-70 truncate min-w-0">
                        {formatTimeWithPreference(
                          prediction.lastDiaperTime,
                          timeFormat,
                        )}
                        {prediction.lastDiaperType && (
                          <span>
                            {' '}
                            • {formatDiaperType(prediction.lastDiaperType)}
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Bottom: Next prediction */}
                  {(userData?.showPredictiveTimes ?? true) && (
                    <div className="text-sm opacity-60 wrap-break-word">
                      Next {timeUntil} • {exactTime}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions */}
        {effectiveIsOverdue && (
          <PredictiveOverdueActions
            isSkipping={isSkipping}
            onLog={handleCardClick}
            onSkip={handleSkip}
          />
        )}

        {/* Goal Tracking Display - Shows diaper change progress for today */}
        {!effectiveIsOverdue && (userData?.showActivityGoals ?? true) && (
          <DiaperGoalDisplay
            currentCount={todaysStats.count}
            dirtyCount={todaysStats.dirtyCount}
            dirtyGoal={dailyDirtyGoal}
            goalCount={dailyDiaperGoal}
            wetCount={todaysStats.wetCount}
            wetGoal={dailyWetGoal}
          />
        )}
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="diaper"
        averageInterval={prediction.averageIntervalHours}
        babyAgeDays={babyAgeDays}
        calculationDetails={prediction.calculationDetails}
        icon={Baby}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        quickLogSettings={quickLogSettings}
        timeFormat={timeFormat}
        title="Diaper"
      />

      {/* Stats Drawer */}
      <DiaperStatsDrawer
        activities={extendedActivities}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        recentActivities={prediction.recentDiaperPattern.map((item) => ({
          ...item,
          type: (item.type ?? undefined) as
            | 'both'
            | 'wet'
            | 'dirty'
            | undefined,
        }))}
        timeFormat={timeFormat}
      />
    </>
  );
}
