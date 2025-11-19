'use client';

import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { toast } from '@nugget/ui/components/sonner';
import { Icons } from '@nugget/ui/custom/icons';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { cn } from '@nugget/ui/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Info, Moon } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getInProgressSleepActivityAction } from './activity-cards.actions';
import { LearningSection } from './learning-section';
import {
  getUpcomingSleepAction,
  skipSleepAction,
  type UpcomingSleepData,
} from './upcoming-sleep/actions';
import { getSleepLearningContent } from './upcoming-sleep/learning-content';
import { useActivityMutations } from './use-activity-mutations';

interface PredictiveSleepCardProps {
  refreshTrigger?: number;
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveSleepCard({
  refreshTrigger = 0,
  onCardClick,
  onActivityLogged,
}: PredictiveSleepCardProps) {
  const [data, setData] = useState<UpcomingSleepData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [skipping, setSkipping] = useState(false);
  // Note: quickLogging kept for potential future use with quick-log functionality
  const [quickLogging] = useState(false);
  const [inProgressActivity, setInProgressActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use activity mutations hook for creating sleep activities
  const { createActivity, isCreating } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  const loadInProgressActivity = useCallback(async () => {
    try {
      const result = await getInProgressSleepActivityAction({});
      if (result?.data?.activity) {
        setInProgressActivity(result.data.activity);
        // Calculate initial elapsed time
        const elapsed = Math.floor(
          (Date.now() - new Date(result.data.activity.startTime).getTime()) /
            1000,
        );
        setElapsedTime(elapsed);
      } else {
        setInProgressActivity(null);
        setElapsedTime(0);
      }
    } catch (err) {
      console.error('Failed to load in-progress sleep:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUpcomingSleepAction();

      if (result?.data) {
        setData(result.data);
        setError(null);
      } else if (result?.serverError) {
        setError(result.serverError);
      }
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : 'Failed to load upcoming sleep data',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is intentionally used to trigger reloads from parent
  useEffect(() => {
    loadData();
    loadInProgressActivity();
  }, [loadData, loadInProgressActivity, refreshTrigger]);

  // Timer effect - updates elapsed time every second when tracking
  useEffect(() => {
    if (inProgressActivity) {
      timerRef.current = setInterval(() => {
        const elapsed = Math.floor(
          (Date.now() - new Date(inProgressActivity.startTime).getTime()) /
            1000,
        );
        setElapsedTime(elapsed);
      }, 1000);
    } else {
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

  if (loading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 animate-pulse bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)] col-span-2',
        )}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Icons.Spinner className="h-12 w-12 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-7 bg-current/20 rounded w-32 mb-2" />
            <div className="h-4 bg-current/20 rounded w-24" />
          </div>
        </div>
      </Card>
    );
  }

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

  if (!data) return null;

  const { prediction, babyAgeDays } = data;

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

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  });
  const exactTime = format(displayNextTime, 'h:mm a');

  // Format recovery time if overdue
  const recoveryTimeUntil = prediction.suggestedRecoveryTime
    ? formatDistanceToNow(prediction.suggestedRecoveryTime, {
        addSuffix: true,
      })
    : null;
  const recoveryExactTime = prediction.suggestedRecoveryTime
    ? format(prediction.suggestedRecoveryTime, 'h:mm a')
    : null;

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDrawer(true);
  };

  const handleQuickLog = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      // Use the suggested duration from prediction data
      const duration = prediction.suggestedDuration;
      const now = new Date();
      const startTime = new Date(now.getTime() - duration * 60 * 1000); // duration is in minutes

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amount: null,
        babyId: 'temp',
        createdAt: now,
        details: {
          sleepType: 'nap' as const,
          type: 'sleep' as const,
        },
        duration: duration,
        endTime: now,
        feedingSource: null,
        id: `optimistic-sleep-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: startTime,
        type: 'sleep' as const,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Add to optimistic store immediately
      addOptimisticActivity(optimisticActivity);

      // Create the actual activity - mutation hook handles invalidation and optimistic state clearing
      const activity = await createActivity({
        activityType: 'sleep',
        details: {
          sleepType: 'nap' as const,
          type: 'sleep' as const,
        },
        duration: duration,
        startTime: startTime,
      });

      // Notify parent component
      onActivityLogged?.(activity);

      // Reload prediction data and in-progress state
      await loadData();
      await loadInProgressActivity();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log sleep');
    }
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSkipping(true);
    try {
      await skipSleepAction();
      toast.success('Sleep reminder skipped');
      await loadData();
    } catch (error) {
      console.error('Failed to skip sleep:', error);
      toast.error('Failed to skip sleep');
    } finally {
      setSkipping(false);
    }
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
          'bg-[oklch(0.75_0.15_195)] text-[oklch(0.18_0.02_250)]',
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
              <button
                className="p-1.5 rounded-full hover:bg-black/10 transition-colors -mr-1.5"
                onClick={handleInfoClick}
                type="button"
              >
                <Info className="size-5 opacity-70" />
              </button>
            </div>
            <div className="space-y-1">
              {inProgressActivity ? (
                // Show active timer
                <div className="flex items-baseline gap-2">
                  <span className="text-lg font-semibold">
                    Sleeping since{' '}
                    {format(new Date(inProgressActivity.startTime), 'h:mm a')}
                  </span>
                  <span className="text-sm opacity-70 font-mono">
                    {formatElapsedTime(elapsedTime)}
                  </span>
                </div>
              ) : effectiveIsOverdue ? (
                // Show overdue warning
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-bold text-amber-400">
                      {prediction.overdueMinutes} min overdue
                    </span>
                  </div>
                  <div className="text-sm opacity-70">
                    Was expected at {exactTime}
                  </div>
                  {recoveryTimeUntil && recoveryExactTime && (
                    <div className="text-sm font-medium pt-1">
                      Suggested: {recoveryTimeUntil} • {recoveryExactTime}
                    </div>
                  )}
                </>
              ) : (
                // Show prediction
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">{timeUntil}</span>
                    <span className="text-sm opacity-70">{exactTime}</span>
                  </div>
                  {prediction.lastSleepTime && (
                    <div className="text-sm opacity-60">
                      {formatDistanceToNow(prediction.lastSleepTime, {
                        addSuffix: true,
                      })}{' '}
                      • {format(prediction.lastSleepTime, 'h:mm a')}
                      {prediction.lastSleepDuration && (
                        <span>
                          {' '}
                          • {Math.floor(prediction.lastSleepDuration / 60)}h{' '}
                          {prediction.lastSleepDuration % 60}m
                        </span>
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions */}
        {effectiveIsOverdue && !inProgressActivity && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-amber-950 hover:bg-amber-900 text-amber-50"
              disabled={isCreating}
              onClick={handleQuickLog}
              size="sm"
            >
              {isCreating ? 'Logging...' : 'Log Now'}
            </Button>
            <Button
              className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-950/20"
              disabled={isCreating}
              onClick={handleCardClick}
              size="sm"
              variant="outline"
            >
              Log with Details
            </Button>
            <Button
              className="flex-1 bg-muted hover:bg-muted/80 text-foreground"
              disabled={quickLogging || skipping}
              onClick={handleSkip}
              size="sm"
              variant="ghost"
            >
              {skipping ? 'Skipping...' : 'Skip'}
            </Button>
          </div>
        )}
      </Card>

      {/* Info Drawer */}
      <Drawer onOpenChange={setShowInfoDrawer} open={showInfoDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Sleep Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Learning Section */}
            {learningContent && (
              <LearningSection
                babyAgeDays={babyAgeDays}
                bgColor="bg-[oklch(0.75_0.15_195)]/5"
                borderColor="border-[oklch(0.75_0.15_195)]/20"
                color="bg-[oklch(0.75_0.15_195)]/10 text-[oklch(0.75_0.15_195)]"
                educationalContent={learningContent.message}
                icon={Moon}
                tips={learningContent.tips}
              />
            )}

            {/* Recent Pattern */}
            {prediction.recentSleepPattern.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Recent Sleep Sessions
                </p>
                <div className="space-y-2">
                  {prediction.recentSleepPattern.slice(0, 5).map((sleep) => (
                    <div
                      className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2"
                      key={sleep.time.toISOString()}
                    >
                      <span className="text-muted-foreground">
                        {format(sleep.time, 'h:mm a')}
                      </span>
                      <div className="flex gap-2 items-center">
                        {sleep.duration !== null && (
                          <span className="text-foreground/70 font-medium">
                            {Math.floor(sleep.duration / 60)}h{' '}
                            {sleep.duration % 60}m
                          </span>
                        )}
                        {sleep.intervalFromPrevious !== null && (
                          <span className="text-muted-foreground/60">
                            ({sleep.intervalFromPrevious.toFixed(1)}h apart)
                          </span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Average Interval */}
            {prediction.averageIntervalHours !== null && (
              <div className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2">
                <span className="text-muted-foreground">Average interval</span>
                <span className="text-foreground font-medium">
                  {prediction.averageIntervalHours.toFixed(1)} hours
                </span>
              </div>
            )}
          </div>
        </DrawerContent>
      </Drawer>
    </>
  );
}
