'use client';

import { useUser } from '@clerk/nextjs';
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
import { format, formatDistanceToNow } from 'date-fns';
import { Info, Milk, User, UserCheck } from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import { LearningSection } from './learning-section';
import {
  claimFeedingAction,
  getUpcomingFeedingAction,
  quickLogFeedingAction,
  type UpcomingFeedingData,
  unclaimFeedingAction,
} from './upcoming-feeding/actions';
import { getFeedingLearningContent } from './upcoming-feeding/learning-content';

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
  const [data, setData] = useState<UpcomingFeedingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [quickLogging, setQuickLogging] = useState(false);

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

  // biome-ignore lint/correctness/useExhaustiveDependencies: refreshTrigger is intentionally used to trigger reloads from parent
  useEffect(() => {
    loadData();
  }, [loadData, refreshTrigger]);

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

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getFeedingLearningContent(babyAgeDays) : null;

  // Only show assignment section if there are multiple family members
  const showAssignment = familyMemberCount > 1;

  // Format countdown
  const timeUntil = formatDistanceToNow(prediction.nextFeedingTime, {
    addSuffix: true,
  });
  const exactTime = format(prediction.nextFeedingTime, 'h:mm a');

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
    setQuickLogging(true);
    try {
      const result = await quickLogFeedingAction({});

      if (result?.data) {
        toast.success('Feeding logged!');
        // Notify parent component for optimistic updates and timeline refresh
        onActivityLogged?.(result.data.activity);
        await loadData(); // Reload to show updated state
      } else if (result?.serverError) {
        toast.error(result.serverError);
      }
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to log feeding');
    } finally {
      setQuickLogging(false);
    }
  };

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          'bg-[oklch(0.68_0.18_35)] text-white',
          prediction.isOverdue
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
              {prediction.isOverdue ? (
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
                  {prediction.lastFeedingTime && (
                    <div className="text-sm opacity-60">
                      {formatDistanceToNow(prediction.lastFeedingTime, {
                        addSuffix: true,
                      })}{' '}
                      • {format(prediction.lastFeedingTime, 'h:mm a')}
                    </div>
                  )}
                </>
              )}
            </div>
          </div>
        </div>

        {/* Overdue Actions */}
        {prediction.isOverdue && (
          <div className="flex gap-2">
            <Button
              className="flex-1 bg-amber-950 hover:bg-amber-900 text-amber-50"
              disabled={quickLogging}
              onClick={handleQuickLog}
              size="sm"
            >
              {quickLogging ? 'Logging...' : 'Log Now'}
            </Button>
            <Button
              className="flex-1 bg-amber-100 hover:bg-amber-200 text-amber-950 border-amber-950/20"
              disabled={quickLogging}
              onClick={handleCardClick}
              size="sm"
              variant="outline"
            >
              Log with Details
            </Button>
          </div>
        )}

        {/* Assignment Section - Only show if multiple family members and not overdue */}
        {showAssignment && !prediction.isOverdue && (
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
                        {format(feed.time, 'h:mm a')}
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
