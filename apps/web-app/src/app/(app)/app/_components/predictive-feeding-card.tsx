'use client';

import { useUser } from '@clerk/nextjs';
import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import { Icons } from '@nugget/ui/custom/icons';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
} from '@nugget/ui/drawer';
import { cn } from '@nugget/ui/lib/utils';
import { toast } from '@nugget/ui/sonner';
import { formatDistanceToNow } from 'date-fns';
import { Info, Milk, User, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useRef, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getInProgressFeedingActivityAction } from './activity-cards.actions';
import { LearningSection } from './learning-section';
import {
  claimFeedingAction,
  getUpcomingFeedingAction,
  skipFeedingAction,
  type UpcomingFeedingData,
  unclaimFeedingAction,
} from './upcoming-feeding/actions';
import { getFeedingLearningContent } from './upcoming-feeding/learning-content';
import { useActivityMutations } from './use-activity-mutations';

interface PredictiveFeedingCardProps {
  refreshTrigger?: number;
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveFeedingCard({
  refreshTrigger = 0,
  onCardClick,
  onActivityLogged,
}: PredictiveFeedingCardProps) {
  const { user } = useUser();
  const utils = api.useUtils();
  const { data: userData } = api.user.current.useQuery();
  const timeFormat = userData?.timeFormat || '12h';
  const [data, setData] = useState<UpcomingFeedingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [skipping, setSkipping] = useState(false);
  const [inProgressActivity, setInProgressActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [elapsedTime, setElapsedTime] = useState(0);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // Use activity mutations hook for creating feeding activities
  const { createActivity, isCreating } = useActivityMutations();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Listen for activity list invalidations to auto-refresh predictions
  const { data: baby } = api.babies.getMostRecent.useQuery();
  const { dataUpdatedAt } = api.activities.list.useQuery(
    { babyId: baby?.id ?? '', limit: 1 }, // Minimal query just to detect changes
    { enabled: !!baby?.id },
  );

  const loadInProgressActivity = useCallback(async () => {
    try {
      const result = await getInProgressFeedingActivityAction({});
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
      console.error('Failed to load in-progress feeding:', err);
    }
  }, []);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getUpcomingFeedingAction();

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
          : 'Failed to load upcoming feeding data',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger and dataUpdatedAt are intentionally used to trigger reloads
  useEffect(() => {
    loadData();
    loadInProgressActivity();
  }, [loadData, loadInProgressActivity, refreshTrigger, dataUpdatedAt]);

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

  const handleClaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data) return;

    setClaiming(true);
    try {
      const result = await claimFeedingAction({
        predictedTime: data.prediction.nextFeedingTime.toISOString(),
      });

      if (result?.data) {
        toast.success('Feeding claimed!');
        await loadData(); // Reload to show updated state
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to claim feeding',
      );
    } finally {
      setClaiming(false);
    }
  };

  const handleUnclaim = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (!data?.scheduledFeeding) return;

    setClaiming(true);
    try {
      const result = await unclaimFeedingAction({
        activityId: data.scheduledFeeding.id,
      });

      if (result?.data) {
        toast.success('Feeding unclaimed');
        await loadData();
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (err) {
      toast.error(
        err instanceof Error ? err.message : 'Failed to unclaim feeding',
      );
    } finally {
      setClaiming(false);
    }
  };

  if (loading) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 animate-pulse bg-[oklch(0.68_0.18_35)] text-white col-span-2',
        )}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Icons.Spinner className="h-12 w-12 animate-spin" />
          </div>
          <div className="flex-1">
            <div className="h-7 bg-white/20 rounded w-32 mb-2" />
            <div className="h-4 bg-white/20 rounded w-24" />
          </div>
        </div>
      </Card>
    );
  }

  if (error) {
    return (
      <Card
        className={cn(
          'relative overflow-hidden border-0 p-6 bg-destructive/10',
        )}
      >
        <p className="text-sm text-destructive">{error}</p>
      </Card>
    );
  }

  if (!data) return null;

  const {
    prediction,
    assignedMember,
    suggestedMember,
    familyMemberCount,
    babyAgeDays,
  } = data;
  const isAssignedToCurrentUser = assignedMember?.userId === user?.id;

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
      : prediction.nextFeedingTime;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getFeedingLearningContent(babyAgeDays) : null;

  // Only show assignment section if there are multiple family members
  const showAssignment = familyMemberCount > 1;

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  });
  const exactTime = formatTimeWithPreference(displayNextTime, timeFormat);

  // Format recovery time if overdue
  const recoveryTimeUntil = prediction.suggestedRecoveryTime
    ? formatDistanceToNow(prediction.suggestedRecoveryTime, {
        addSuffix: true,
      })
    : null;
  const recoveryExactTime = prediction.suggestedRecoveryTime
    ? formatTimeWithPreference(prediction.suggestedRecoveryTime, timeFormat)
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
      const now = new Date();
      const defaultAmount = 120; // Default feeding amount in ml

      // Create optimistic activity for immediate UI feedback
      const optimisticActivity = {
        amount: defaultAmount,
        assignedUserId: null,
        babyId: 'temp',
        createdAt: now,
        details: null,
        duration: null,
        endTime: null,
        familyId: 'temp',
        familyMemberId: null,
        feedingSource: 'formula' as const, // Default to formula for quick log
        id: `optimistic-feeding-${Date.now()}`,
        isScheduled: false,
        notes: null,
        startTime: now,
        subjectType: 'baby' as const,
        type: 'feeding' as const,
        updatedAt: now,
        userId: 'temp',
      } as typeof Activities.$inferSelect;

      // Add to optimistic store immediately
      addOptimisticActivity(optimisticActivity);

      // Create the actual activity - mutation hook handles invalidation
      const activity = await createActivity({
        activityType: 'feeding',
        amount: defaultAmount,
        feedingSource: 'formula',
        startTime: now,
      });

      // Notify parent component
      onActivityLogged?.(activity);

      // Reload prediction data and in-progress state
      await loadData();
      await loadInProgressActivity();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log feeding');
    }
  };

  const handleSkip = async (e: React.MouseEvent) => {
    e.stopPropagation();
    setSkipping(true);
    try {
      await skipFeedingAction();
      toast.success('Feeding reminder skipped');
      // Invalidate activities list to refresh timeline
      await utils.activities.list.invalidate();
      await loadData();
    } catch (error) {
      console.error('Failed to skip feeding:', error);
      toast.error('Failed to skip feeding');
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
          'bg-[oklch(0.68_0.18_35)] text-white',
          effectiveIsOverdue
            ? 'border-4 border-dashed border-amber-500'
            : 'border-0',
        )}
        onClick={handleCardClick}
      >
        <div className="flex items-center gap-4">
          <div className="opacity-30">
            <Milk className="h-12 w-12" strokeWidth={1.5} />
          </div>
          <div className="flex-1">
            <div className="flex items-center justify-between mb-2">
              <h2 className="text-2xl font-bold">Feeding</h2>
              <button
                className="p-1.5 rounded-full hover:bg-white/10 transition-colors -mr-1.5"
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
                    Feeding since{' '}
                    {formatTimeWithPreference(
                      new Date(inProgressActivity.startTime),
                      timeFormat,
                    )}
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
                  {prediction.lastFeedingTime && (
                    <div className="text-sm opacity-60">
                      {formatDistanceToNow(prediction.lastFeedingTime, {
                        addSuffix: true,
                      })}{' '}
                      •{' '}
                      {formatTimeWithPreference(
                        prediction.lastFeedingTime,
                        timeFormat,
                      )}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions - Only show if not actively tracking */}
        {!inProgressActivity && effectiveIsOverdue && (
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
              disabled={isCreating || skipping}
              onClick={handleSkip}
              size="sm"
              variant="ghost"
            >
              {skipping ? 'Skipping...' : 'Skip'}
            </Button>
          </div>
        )}

        {/* Assignment Section - Only show if multiple family members, not overdue, and not actively tracking */}
        {showAssignment && !effectiveIsOverdue && !inProgressActivity && (
          <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/20">
            {assignedMember ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-white/20 flex items-center justify-center">
                    {assignedMember.avatarUrl ? (
                      <img
                        alt={assignedMember.userName}
                        className="size-9 rounded-full"
                        src={assignedMember.avatarUrl}
                      />
                    ) : (
                      <UserCheck className="size-5" />
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {assignedMember.userName}
                  </p>
                </div>
                {isAssignedToCurrentUser && (
                  <Button
                    className="bg-white/20 hover:bg-white/30 text-white border-0"
                    disabled={claiming}
                    onClick={handleUnclaim}
                    size="sm"
                    variant="ghost"
                  >
                    {claiming ? 'Unclaiming...' : 'Unclaim'}
                  </Button>
                )}
              </>
            ) : suggestedMember ? (
              <>
                <div className="flex items-center gap-2.5">
                  <div className="size-9 rounded-full bg-white/20 flex items-center justify-center">
                    {suggestedMember.avatarUrl ? (
                      <img
                        alt={suggestedMember.userName}
                        className="size-9 rounded-full"
                        src={suggestedMember.avatarUrl}
                      />
                    ) : (
                      <User className="size-5" />
                    )}
                  </div>
                  <p className="text-sm font-medium">
                    {suggestedMember.userName}
                  </p>
                </div>
                <Button
                  className="bg-white text-[oklch(0.68_0.18_35)] hover:bg-white/90"
                  disabled={claiming}
                  onClick={handleClaim}
                  size="sm"
                >
                  {claiming ? 'Claiming...' : 'Claim'}
                </Button>
              </>
            ) : (
              <Button
                className="w-full bg-white/20 hover:bg-white/30 text-white border-white/30"
                disabled={claiming}
                onClick={handleClaim}
                size="sm"
                variant="outline"
              >
                {claiming ? 'Claiming...' : 'Claim This Feeding'}
              </Button>
            )}
          </div>
        )}
      </Card>

      {/* Info Drawer */}
      <Drawer onOpenChange={setShowInfoDrawer} open={showInfoDrawer}>
        <DrawerContent className="max-h-[90vh]">
          <DrawerHeader>
            <DrawerTitle>Feeding Details</DrawerTitle>
          </DrawerHeader>
          <div className="px-4 pb-6 space-y-4 overflow-y-auto">
            {/* Learning Section */}
            {learningContent && (
              <LearningSection
                babyAgeDays={babyAgeDays}
                bgColor="bg-[oklch(0.68_0.18_35)]/5"
                borderColor="border-[oklch(0.68_0.18_35)]/20"
                color="bg-[oklch(0.68_0.18_35)]/10 text-[oklch(0.68_0.18_35)]"
                educationalContent={learningContent.message}
                icon={Milk}
                tips={learningContent.tips}
              />
            )}

            {/* Recent Pattern */}
            {prediction.recentFeedingPattern.length > 0 && (
              <div>
                <p className="text-sm font-medium text-muted-foreground mb-2">
                  Recent Feedings
                </p>
                <div className="space-y-2">
                  {prediction.recentFeedingPattern.slice(0, 5).map((feed) => (
                    <div
                      className="flex items-center justify-between text-sm bg-muted/20 rounded px-3 py-2"
                      key={feed.time.toISOString()}
                    >
                      <span className="text-muted-foreground">
                        {formatTimeWithPreference(feed.time, timeFormat)}
                      </span>
                      {feed.intervalFromPrevious !== null && (
                        <span className="text-foreground/70 font-medium">
                          {feed.intervalFromPrevious.toFixed(1)}h interval
                        </span>
                      )}
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
