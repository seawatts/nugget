'use client';

import { useUser } from '@clerk/nextjs';
import { Button } from '@nugget/ui/button';
import { toast } from '@nugget/ui/sonner';
import { format, formatDistanceToNow } from 'date-fns';
import {
  AlertCircle,
  ChevronDown,
  ChevronUp,
  Milk,
  User,
  UserCheck,
} from 'lucide-react';
import { useCallback, useEffect, useState } from 'react';
import {
  claimFeedingAction,
  getUpcomingFeedingAction,
  type UpcomingFeedingData,
  unclaimFeedingAction,
} from './upcoming-feeding/actions';
import { getFeedingStatus } from './upcoming-feeding/prediction';

interface UpcomingFeedingCardProps {
  refreshTrigger?: number;
}

export function UpcomingFeedingCard({
  refreshTrigger = 0,
}: UpcomingFeedingCardProps) {
  const { user } = useUser();
  const [data, setData] = useState<UpcomingFeedingData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [claiming, setClaiming] = useState(false);
  const [showDetails, setShowDetails] = useState(false);

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

  const handleClaim = async () => {
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

  const handleUnclaim = async () => {
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
      <div className="rounded-xl border border-border bg-card/50 p-5 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-40 mb-4" />
        <div className="h-20 bg-muted/30 rounded" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-5">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (!data) return null;

  const {
    prediction,
    assignedMember,
    suggestedMember,
    guidanceMessage,
    familyMemberCount,
  } = data;
  const feedingStatus = getFeedingStatus(prediction.nextFeedingTime);
  const isAssignedToCurrentUser = assignedMember?.userId === user?.id;

  // Only show assignment section if there are multiple family members
  const showAssignment = familyMemberCount > 1;

  // Format countdown
  const timeUntil = formatDistanceToNow(prediction.nextFeedingTime, {
    addSuffix: true,
  });
  const exactTime = format(prediction.nextFeedingTime, 'h:mm a');

  // Status colors
  const statusColors = {
    overdue: {
      bg: 'bg-gradient-to-br from-destructive/20 to-destructive/30',
      border: 'border-destructive/40',
      icon: 'text-destructive',
      text: 'text-destructive',
    },
    soon: {
      bg: 'bg-gradient-to-br from-warning/20 to-warning/30',
      border: 'border-warning/40',
      icon: 'text-warning',
      text: 'text-warning',
    },
    upcoming: {
      bg: 'bg-gradient-to-br from-card/50 to-card/80',
      border: 'border-border',
      icon: 'text-[oklch(0.68_0.18_35)]',
      text: 'text-foreground',
    },
  };

  const colors = statusColors[feedingStatus];

  return (
    <div
      className={`rounded-xl border ${colors.border} ${colors.bg} backdrop-blur-sm p-5 shadow-sm`}
    >
      {/* Main Content - Countdown */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <Milk className={`size-6 ${colors.icon}`} />
          <div>
            <p className={`text-2xl font-bold ${colors.text} leading-tight`}>
              {timeUntil.replace('in ', '').replace(' ago', '')}
            </p>
            <p className="text-sm text-muted-foreground">
              {feedingStatus === 'overdue' ? 'overdue' : 'until feeding'}
              <span className="text-muted-foreground/60 mx-1">•</span>
              <span className="font-medium">{exactTime}</span>
            </p>
          </div>
        </div>
        {feedingStatus === 'overdue' && (
          <AlertCircle className="size-5 text-destructive" />
        )}
      </div>

      {/* Assignment Section - Only show if multiple family members */}
      {showAssignment && (
        <div className="flex items-center justify-between pt-3 border-t border-border/50">
          {assignedMember ? (
            <>
              <div className="flex items-center gap-2.5">
                <div className="size-9 rounded-full bg-muted/40 flex items-center justify-center">
                  {assignedMember.avatarUrl ? (
                    <img
                      alt={assignedMember.userName}
                      className="size-9 rounded-full"
                      src={assignedMember.avatarUrl}
                    />
                  ) : (
                    <UserCheck className="size-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {assignedMember.userName}
                </p>
              </div>
              {isAssignedToCurrentUser && (
                <Button
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
                <div className="size-9 rounded-full bg-muted/40 flex items-center justify-center">
                  {suggestedMember.avatarUrl ? (
                    <img
                      alt={suggestedMember.userName}
                      className="size-9 rounded-full"
                      src={suggestedMember.avatarUrl}
                    />
                  ) : (
                    <User className="size-5 text-muted-foreground" />
                  )}
                </div>
                <p className="text-sm font-medium text-foreground">
                  {suggestedMember.userName}
                </p>
              </div>
              <Button
                disabled={claiming}
                onClick={handleClaim}
                size="sm"
                variant="default"
              >
                {claiming ? 'Claiming...' : 'Claim'}
              </Button>
            </>
          ) : (
            <Button
              className="w-full"
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

      {/* Details Toggle */}
      {(prediction.recentFeedingPattern.length > 0 ||
        prediction.averageIntervalHours !== null) && (
        <button
          className="w-full pt-3 mt-3 border-t border-border/50 flex items-center justify-center gap-2 text-xs text-muted-foreground hover:text-foreground transition-colors"
          onClick={() => setShowDetails(!showDetails)}
          type="button"
        >
          <span>Details</span>
          {showDetails ? (
            <ChevronUp className="size-3" />
          ) : (
            <ChevronDown className="size-3" />
          )}
        </button>
      )}

      {/* Collapsible Details */}
      {showDetails && (
        <div className="space-y-3 pt-3">
          {/* Recent Pattern */}
          {prediction.recentFeedingPattern.length > 0 && (
            <div>
              <p className="text-xs font-medium text-muted-foreground mb-2">
                Recent Feedings
              </p>
              <div className="space-y-1.5">
                {prediction.recentFeedingPattern.slice(0, 3).map((feed) => (
                  <div
                    className="flex items-center justify-between text-xs bg-muted/20 rounded px-2 py-1.5"
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
            <div className="flex items-center justify-between text-xs bg-muted/20 rounded px-2 py-1.5">
              <span className="text-muted-foreground">Average interval</span>
              <span className="text-foreground font-medium">
                {prediction.averageIntervalHours.toFixed(1)} hours
              </span>
            </div>
          )}

          {/* Guidance */}
          <div className="text-xs text-muted-foreground/80 px-1">
            {guidanceMessage}
          </div>
        </div>
      )}
    </div>
  );
}
