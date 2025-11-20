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
  elapsedTime?: number;
  timeFormat: '12h' | '24h';
}

export function PredictiveTimeDisplay({
  isLoading,
  inProgressActivity,
  effectiveIsOverdue,
  overdueMinutes,
  timeUntil,
  exactTime,
  lastActivityTime,
  elapsedTime = 0,
  timeFormat,
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
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">
          Since{' '}
          {formatTimeWithPreference(
            new Date(inProgressActivity.startTime),
            timeFormat,
          )}
        </span>
        <span className="text-sm opacity-70 font-mono">
          {formatElapsedTime(elapsedTime)}
        </span>
      </div>
    );
  }

  // Overdue state
  if (effectiveIsOverdue) {
    return (
      <>
        <div className="flex items-baseline gap-2">
          <span className="text-lg font-bold text-amber-400">
            {formatOverdueTime(overdueMinutes ?? 0)} overdue ({exactTime})
          </span>
        </div>
        {lastActivityTime && (
          <div className="text-sm opacity-60">
            {formatDistanceToNow(lastActivityTime, {
              addSuffix: true,
            })}{' '}
            • {formatTimeWithPreference(lastActivityTime, timeFormat)}
          </div>
        )}
      </>
    );
  }

  // Predicted/normal state
  return (
    <>
      <div className="flex items-baseline gap-2">
        <span className="text-lg font-semibold">{timeUntil}</span>
        <span className="text-sm opacity-70">{exactTime}</span>
      </div>
      {lastActivityTime && (
        <div className="text-sm opacity-60">
          {formatDistanceToNow(lastActivityTime, {
            addSuffix: true,
          })}{' '}
          • {formatTimeWithPreference(lastActivityTime, timeFormat)}
        </div>
      )}
    </>
  );
}
