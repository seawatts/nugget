'use client';

import { Check, X } from 'lucide-react';
import { formatDayAbbreviation } from '../../shared/components/stats';
import type { VitaminDDay } from '../../shared/types';

interface VitaminDTrackerProps {
  days: VitaminDDay[];
}

export function VitaminDTracker({ days }: VitaminDTrackerProps) {
  return (
    <div className="grid grid-cols-7 gap-2">
      {days.map((day) => {
        const date = new Date(day.date);
        const dayAbbr = formatDayAbbreviation(date);

        return (
          <div className="flex flex-col items-center gap-1.5" key={day.date}>
            <span className="text-xs font-medium text-muted-foreground">
              {dayAbbr}
            </span>
            <div
              className={`flex size-10 items-center justify-center rounded-full transition-colors ${
                day.hasVitaminD
                  ? 'bg-green-500/30 text-green-100 dark:bg-green-400/30 dark:text-green-200'
                  : 'bg-white/10 text-white/40 dark:bg-white/10 dark:text-white/30'
              }`}
            >
              {day.hasVitaminD ? (
                <Check className="size-5" strokeWidth={2.5} />
              ) : (
                <X className="size-5" strokeWidth={2.5} />
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
