'use client';

import { cn } from '@nugget/ui/lib/utils';

interface PredictiveProgressTrackProps {
  progressPercent?: number | null;
  srLabel?: string | null;
  startLabel?: string | null;
  endLabel?: string | null;
  className?: string;
  trackClassName?: string;
}

export function PredictiveProgressTrack({
  progressPercent = 0,
  srLabel,
  startLabel,
  endLabel,
  className,
  trackClassName,
}: PredictiveProgressTrackProps) {
  const safePercent = Math.max(0, Math.min(100, progressPercent ?? 0));

  return (
    <div className={cn('px-2', className)}>
      {srLabel ? <span className="sr-only">{srLabel}</span> : null}
      {(startLabel || endLabel) && (
        <div className="mb-1.5 flex items-center justify-between text-[11px] font-semibold uppercase tracking-wide text-white/70">
          <span>{startLabel}</span>
          <span>{endLabel}</span>
        </div>
      )}
      <div className="flex items-center gap-2">
        <div className="size-2.5 shrink-0 rounded-full bg-white/40" />
        <div className="relative flex-1">
          <div
            className={cn(
              'h-1 w-full overflow-hidden rounded-full bg-white/15',
              trackClassName,
            )}
          >
            <div
              className="h-full rounded-full bg-white/70 transition-[width] duration-500 ease-out"
              style={{ width: `${safePercent}%` }}
            />
          </div>
        </div>
        <div
          className={cn(
            'size-2.5 shrink-0 rounded-full bg-white/40',
            safePercent >= 99 && 'bg-white',
          )}
        />
      </div>
    </div>
  );
}
