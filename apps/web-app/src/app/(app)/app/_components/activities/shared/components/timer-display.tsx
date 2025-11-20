'use client';

/**
 * Reusable timer display component
 * Shows duration in HH:MM:SS format with optional start time
 */

import { Timer } from 'lucide-react';
import { formatElapsedTime } from '../time-formatting-utils';

interface TimerDisplayProps {
  duration: number;
  startTime?: Date | null;
  isTracking?: boolean;
  label?: string;
  showStartTime?: boolean;
}

export function TimerDisplay({
  duration,
  startTime,
  isTracking = false,
  label = 'Duration',
  showStartTime = true,
}: TimerDisplayProps) {
  return (
    <div className="bg-card rounded-2xl p-8 text-center">
      {isTracking && (
        <div className="flex items-center justify-center gap-2 mb-4">
          <Timer className="h-5 w-5 text-muted-foreground animate-pulse" />
          <p className="text-sm text-muted-foreground">Tracking in progress</p>
        </div>
      )}
      <div className="text-6xl font-bold text-foreground mb-2">
        {formatElapsedTime(duration)}
      </div>
      <p className="text-muted-foreground">{label}</p>
      {showStartTime && startTime && (
        <p className="mt-2 text-xs text-muted-foreground">
          Started{' '}
          {startTime.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </p>
      )}
    </div>
  );
}
