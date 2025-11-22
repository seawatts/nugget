'use client';

import type { Activities } from '@nugget/db/schema';
import { Skeleton } from '@nugget/ui/skeleton';
import { formatDistanceToNow } from 'date-fns';
import { formatTimeWithPreference } from '~/lib/format-time';
import {
  formatElapsedTime,
  formatOverdueTime,
} from '../../time-formatting-utils';

interface PredictiveTimeDisplayProps {
  isLoading: boolean;
  inProgressActivity?: typeof Activities.$inferSelect | null;
  effectiveIsOverdue: boolean;
  overdueMinutes?: number | null;
  timeUntil: string;
  exactTime: string;
  lastActivityTime?: Date | null;
  lastActivityAmount?: string | null; // formatted amount string (e.g., "4 oz", "120 ml")
  predictedAmount?: string | null; // formatted predicted amount string
  elapsedTime?: number;
  timeFormat: '12h' | '24h';
  activityLabel?: string; // e.g., "feeding", "sleeping"
}

export function PredictiveTimeDisplay({
  isLoading,
  inProgressActivity,
  effectiveIsOverdue,
  overdueMinutes,
  timeUntil,
  exactTime,
  lastActivityTime,
  lastActivityAmount,
  predictedAmount,
  elapsedTime = 0,
  timeFormat,
  activityLabel = 'active',
}: PredictiveTimeDisplayProps) {
  if (isLoading) {
    return (
      <>
        <Skeleton className="h-6 w-48 bg-white/20" />
        <Skeleton className="h-4 w-32 bg-white/20" />
      </>
    );
  }

  // In-progress state
  if (inProgressActivity) {
    return (
      <>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold">Currently {activityLabel}</span>
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
    );
  }

  // Overdue state
  if (effectiveIsOverdue) {
    return (
      <>
        {/* Top: Last activity (no label) */}
        {lastActivityTime && (
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-semibold">
              {formatDistanceToNow(lastActivityTime, {
                addSuffix: true,
              })}
            </span>
            <span className="text-sm opacity-70">
              {formatTimeWithPreference(lastActivityTime, timeFormat)}
              {lastActivityAmount && <span> • {lastActivityAmount}</span>}
            </span>
          </div>
        )}
        {/* Bottom: Next prediction with overdue indicator */}
        <div className="text-sm opacity-60">
          Next {exactTime}
          {overdueMinutes && (
            <span className="text-amber-400 font-medium">
              {' '}
              • {formatOverdueTime(overdueMinutes)} overdue
            </span>
          )}
          {predictedAmount && <span> • {predictedAmount}</span>}
        </div>
      </>
    );
  }

  // Predicted/normal state
  return (
    <>
      {/* Top: Last activity (no label) */}
      {lastActivityTime && (
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-semibold">
            {formatDistanceToNow(lastActivityTime, {
              addSuffix: true,
            })}
          </span>
          <span className="text-sm opacity-70">
            {formatTimeWithPreference(lastActivityTime, timeFormat)}
            {lastActivityAmount && <span> • {lastActivityAmount}</span>}
          </span>
        </div>
      )}
      {/* Bottom: Next prediction */}
      <div className="text-sm opacity-60">
        Next {timeUntil} • {exactTime}
        {predictedAmount && <span> • {predictedAmount}</span>}
      </div>
    </>
  );
}
