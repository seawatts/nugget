'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Skeleton } from '@nugget/ui/components/skeleton';
import { Icons } from '@nugget/ui/custom/icons';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { Info, Moon, Zap } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useEffect, useRef, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import {
  PredictiveCardSkeleton,
  PredictiveInfoDrawer,
  PredictiveOverdueActions,
  usePredictiveActions,
} from '../shared/components/predictive-cards';
import { skipSleepAction } from './actions';
import { SleepGoalDisplay } from './components/sleep-goal-display';
import { getSleepLearningContent } from './learning-content';
import { predictNextSleep } from './prediction';
import {
  calculateTodaysSleepStats,
  getDailyNapGoal,
  getDailySleepHoursGoal,
} from './sleep-goals';
import { getSleepGuidanceByAge } from './sleep-intervals';

interface PredictiveSleepCardProps {
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveSleepCard({
  onCardClick,
  onActivityLogged: _onActivityLogged,
}: PredictiveSleepCardProps) {
  const params = useParams<{ babyId?: string }>();
  const babyId = params?.babyId;

  const { data: userData } = api.user.current.useQuery();
  const timeFormat = userData?.timeFormat || '12h';

  // Query today's activities for goal tracking
  const { data: todaysActivitiesData } = api.activities.list.useQuery(
    {
      babyId: babyId ?? '',
      limit: 100,
    },
    { enabled: Boolean(babyId) },
  );

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

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        babyAgeDays: queryData.babyAgeDays,
        guidanceMessage:
          queryData.babyAgeDays !== null
            ? getSleepGuidanceByAge(queryData.babyAgeDays)
            : "Follow your pediatrician's sleep recommendations.",
        prediction: predictNextSleep(
          queryData.recentActivities,
          queryData.babyBirthDate,
        ),
      }
    : null;

  const error = queryError?.message || null;

  // Build smart defaults for quick log
  const defaultQuickLogData: Record<string, unknown> = {};
  if (
    (userData?.quickLogSleepUseSuggestedDuration ?? true) &&
    data?.prediction.suggestedDuration
  ) {
    defaultQuickLogData.duration = data.prediction.suggestedDuration;
    // Calculate end time based on suggested duration
    const endTime = new Date();
    endTime.setMinutes(
      endTime.getMinutes() + data.prediction.suggestedDuration,
    );
    defaultQuickLogData.endTime = endTime;
  }

  // Use shared actions hook with sleep defaults
  const { handleQuickLog, handleSkip, isCreating, isSkipping } =
    usePredictiveActions({
      activityType: 'sleep',
      defaultQuickLogData,
      onActivityLogged: _onActivityLogged,
      skipAction: skipSleepAction,
    });

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

  // Calculate today's sleep statistics for goal display
  const todaysStats = calculateTodaysSleepStats(todaysActivitiesData ?? []);
  const dailyNapGoal = getDailyNapGoal(babyAgeDays ?? 0);
  const dailySleepHoursGoal = getDailySleepHoursGoal(babyAgeDays ?? 0);

  // Check if we should suppress overdue state due to recent skip
  const isRecentlySkipped = prediction.recentSkipTime
    ? Date.now() - new Date(prediction.recentSkipTime).getTime() <
      prediction.intervalHours * 60 * 60 * 1000
    : false;
  const effectiveIsOverdue = prediction.isOverdue && !isRecentlySkipped;

  // Calculate display time - if recently skipped, show next predicted time from skip moment
  const displayNextTime =
    isRecentlySkipped && prediction.recentSkipTime
      ? new Date(
          new Date(prediction.recentSkipTime).getTime() +
            prediction.intervalHours * 60 * 60 * 1000,
        )
      : prediction.nextSleepTime;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getSleepLearningContent(babyAgeDays) : null;

  // Build quick log settings for info drawer
  const quickLogSettings = {
    activeSettings: [
      ...((userData?.quickLogSleepUseSuggestedDuration ?? true)
        ? ['Suggested duration']
        : []),
    ],
    enabled: userData?.quickLogEnabled ?? true,
  };

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  });
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

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDrawer(true);
  };

  // Format elapsed time for display
  const formatElapsedTime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-activity-sleep text-activity-sleep-foreground',
          effectiveIsOverdue
            ? 'border-4 border-dashed border-amber-500'
            : 'border-0',
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Moon className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Sleep</h2>
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
              ) : inProgressActivity ? (
                // Show active timer
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold">
                      Currently sleeping
                    </span>
                    <span className="text-base font-mono opacity-90">
                      {formatElapsedTime(elapsedTime)}
                    </span>
                  </div>
                  <div className="text-sm opacity-60">
                    Started{' '}
                    {formatTimeWithPreference(
                      new Date(inProgressActivity.startTime),
                      timeFormat,
                    )}
                  </div>
                </>
              ) : effectiveIsOverdue ? (
                // Show overdue warning
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastSleepTime && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">
                        {formatDistanceToNow(prediction.lastSleepTime, {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="text-sm opacity-70">
                        {formatTimeWithPreference(
                          prediction.lastSleepTime,
                          timeFormat,
                        )}
                        {prediction.lastSleepDuration && (
                          <span>
                            {' '}
                            • {Math.floor(prediction.lastSleepDuration / 60)}h{' '}
                            {prediction.lastSleepDuration % 60}m
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Bottom: Next prediction with overdue indicator */}
                  <div className="text-sm opacity-60">
                    Next {exactTime}
                    {prediction.overdueMinutes && (
                      <span className="text-amber-400 font-medium">
                        {' '}
                        • {formatOverdueTime(prediction.overdueMinutes)} overdue
                      </span>
                    )}
                  </div>
                </>
              ) : (
                // Show prediction
                <>
                  {/* Top: Last activity (no label) */}
                  {prediction.lastSleepTime && (
                    <div className="flex items-baseline gap-2">
                      <span className="text-lg font-semibold">
                        {formatDistanceToNow(prediction.lastSleepTime, {
                          addSuffix: true,
                        })}
                      </span>
                      <span className="text-sm opacity-70">
                        {formatTimeWithPreference(
                          prediction.lastSleepTime,
                          timeFormat,
                        )}
                        {prediction.lastSleepDuration && (
                          <span>
                            {' '}
                            • {Math.floor(prediction.lastSleepDuration / 60)}h{' '}
                            {prediction.lastSleepDuration % 60}m
                          </span>
                        )}
                      </span>
                    </div>
                  )}
                  {/* Bottom: Next prediction */}
                  <div className="text-sm opacity-60">
                    Next {timeUntil} • {exactTime}
                  </div>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions */}
        {effectiveIsOverdue && !inProgressActivity && (
          <PredictiveOverdueActions
            isSkipping={isSkipping}
            onLog={handleCardClick}
            onSkip={handleSkip}
          />
        )}

        {/* Goal Tracking Display - Shows sleep progress for today */}
        {!effectiveIsOverdue && (
          <SleepGoalDisplay
            avgNapDuration={todaysStats.avgNapDuration}
            longestNapMinutes={todaysStats.longestNapMinutes}
            napCount={todaysStats.napCount}
            napGoal={dailyNapGoal}
            sleepHoursGoal={dailySleepHoursGoal}
            totalSleepMinutes={todaysStats.totalSleepMinutes}
          />
        )}
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="sleep"
        averageInterval={prediction.averageIntervalHours}
        babyAgeDays={babyAgeDays}
        calculationDetails={prediction.calculationDetails}
        formatPatternItem={(item): React.ReactNode => (
          <>
            <span className="text-muted-foreground">
              {formatTimeWithPreference(item.time, timeFormat)}
            </span>
            <div className="flex gap-2 items-center">
              {'duration' in item && item.duration !== null && (
                <span className="text-foreground/70 font-medium">
                  {Math.floor((item.duration as number) / 60)}h{' '}
                  {(item.duration as number) % 60}m
                </span>
              )}
              {'intervalFromPrevious' in item &&
                item.intervalFromPrevious !== null && (
                  <span className="text-muted-foreground/60">
                    ({(item.intervalFromPrevious as number).toFixed(1)}h apart)
                  </span>
                )}
            </div>
          </>
        )}
        icon={Moon}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        quickLogSettings={quickLogSettings}
        recentPattern={prediction.recentSleepPattern}
        timeFormat={timeFormat}
        title="Sleep"
      />
    </>
  );
}
