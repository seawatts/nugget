'use client';

import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { Button } from '@nugget/ui/components/button';
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
import { Baby, Info } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { LearningSection } from './learning-section';
import {
  getUpcomingDiaperAction,
  type UpcomingDiaperData,
} from './upcoming-diaper/actions';
import { getDiaperLearningContent } from './upcoming-diaper/learning-content';
import { useActivityMutations } from './use-activity-mutations';

interface PredictiveDiaperCardProps {
  refreshTrigger?: number;
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveDiaperCard({
  refreshTrigger = 0,
  onCardClick,
  onActivityLogged,
}: PredictiveDiaperCardProps) {
  const [data, setData] = useState<UpcomingDiaperData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [skipTimestamp, setSkipTimestamp] = useState<number | null>(null);

  // Use activity mutations hook for creating diaper activities
  const { createActivity, isCreating } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUpcomingDiaperAction();

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
          : 'Failed to load upcoming diaper data',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is intentionally used to trigger reloads from parent
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

  // Load skip timestamp from localStorage
  useEffect(() => {
    const stored = localStorage.getItem('skip-diaper');
    if (stored) {
      setSkipTimestamp(Number.parseInt(stored, 10));
    }
  }, []);

  if (loading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 animate-pulse bg-[oklch(0.78_0.14_60)] text-[oklch(0.18_0.02_250)] col-span-2',
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
  const isRecentlySkipped = skipTimestamp
    ? Date.now() - skipTimestamp < prediction.intervalHours * 60 * 60 * 1000
    : false;
  const effectiveIsOverdue = prediction.isOverdue && !isRecentlySkipped;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getDiaperLearningContent(babyAgeDays) : null;

  // Format countdown
  const timeUntil = formatDistanceToNow(prediction.nextDiaperTime, {
    addSuffix: true,
  });
  const exactTime = format(prediction.nextDiaperTime, 'h:mm a');

  // Format recovery time if overdue
  const recoveryTimeUntil = prediction.suggestedRecoveryTime
    ? formatDistanceToNow(prediction.suggestedRecoveryTime, {
        addSuffix: true,
      })
    : null;
  const recoveryExactTime = prediction.suggestedRecoveryTime
    ? format(prediction.suggestedRecoveryTime, 'h:mm a')
    : null;

  // Format diaper type
  const formatDiaperType = (type: string | null) => {
    if (!type) return '';
    if (type === 'both') return 'Wet & Dirty';
    if (type === 'wet') return 'Wet';
    if (type === 'dirty') return 'Dirty';
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

  const handleQuickLog = async (e: React.MouseEvent) => {
    e.stopPropagation();

    try {
      const now = new Date();

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amount: null,
        assignedUserId: null,
        babyId: 'temp',
        createdAt: now,
        details: {
          type: 'both' as const, // Quick log defaults to both
        },
        duration: null,
        endTime: null,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: null,
        id: `optimistic-diaper-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        type: 'diaper' as const,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Add to optimistic store immediately
      addOptimisticActivity(optimisticActivity);

      // Create the actual activity - mutation hook handles invalidation
      const activity = await createActivity({
        activityType: 'diaper',
        details: {
          type: 'both' as const,
        },
        startTime: now,
      });

      // Clear skip timestamp when activity is logged
      localStorage.removeItem('skip-diaper');
      setSkipTimestamp(null);

      // Notify parent component
      onActivityLogged?.(activity);

      // Reload prediction data
      await loadData();
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to log diaper change',
      );
    }
  };

  const handleSkip = (e: React.MouseEvent) => {
    e.stopPropagation();
    const now = Date.now();
    localStorage.setItem('skip-diaper', now.toString());
    setSkipTimestamp(now);
    toast.success('Diaper reminder skipped');
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-[oklch(0.78_0.14_60)] text-[oklch(0.18_0.02_250)]',
          effectiveIsOverdue
            ? 'border-4 border-dashed border-amber-500'
            : 'border-0',
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Baby className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Diaper</h2>
              <button
                className="p-1.5 rounded-full hover:bg-black/10 transition-colors -mr-1.5"
                onClick={handleInfoClick}
                type="button"
              >
                <Info className="size-5 opacity-70" />
              </button>
            </div>
            <div className="space-y-1">
              {effectiveIsOverdue ? (
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
                <>
                  <div className="flex items-baseline gap-2">
                    <span className="text-lg font-semibold">{timeUntil}</span>
                    <span className="text-sm opacity-70">{exactTime}</span>
                  </div>
                  {prediction.lastDiaperTime && (
                    <div className="text-sm opacity-60">
                      {formatDistanceToNow(prediction.lastDiaperTime, {
                        addSuffix: true,
                      })}{' '}
                      • {format(prediction.lastDiaperTime, 'h:mm a')}
                      {prediction.lastDiaperType && (
                        <span>
                          {' '}
                          • {formatDiaperType(prediction.lastDiaperType)}
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
        {effectiveIsOverdue && (
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
              disabled={isCreating}
              onClick={handleSkip}
              size="sm"
              variant="ghost"
            >
              Skip
            </Button>
          </div>
        )}
      </Card>

      {/* Info Drawer */}
      <Drawer onOpenChange={setShowInfoDrawer} open={showInfoDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Diaper Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Learning Section */}
            {learningContent && (
              <LearningSection
                babyAgeDays={babyAgeDays}
                bgColor="bg-[oklch(0.78_0.14_60)]/5"
                borderColor="border-[oklch(0.78_0.14_60)]/20"
                color="bg-[oklch(0.78_0.14_60)]/10 text-[oklch(0.78_0.14_60)]"
                educationalContent={learningContent.message}
                icon={Baby}
                tips={learningContent.tips}
              />
            )}

            {/* Recent Pattern */}
            {prediction.recentDiaperPattern.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Recent Changes
                </p>
                <div className="space-y-2">
                  {prediction.recentDiaperPattern.slice(0, 5).map((diaper) => (
                    <div
                      className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2"
                      key={diaper.time.toISOString()}
                    >
                      <span className="text-muted-foreground">
                        {format(diaper.time, 'h:mm a')}
                      </span>
                      <div className="flex gap-2 items-center">
                        {diaper.type && (
                          <span className="text-foreground/70 font-medium">
                            {formatDiaperType(diaper.type)}
                          </span>
                        )}
                        {diaper.intervalFromPrevious !== null && (
                          <span className="text-muted-foreground/60">
                            ({diaper.intervalFromPrevious.toFixed(1)}h apart)
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
