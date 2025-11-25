'use client';

import { cn } from '@nugget/ui/lib/utils';
import { Check, X } from 'lucide-react';
import type { SevenDayActivity } from '../../hooks/use-seven-day-activities';
import { formatDayAbbreviation } from '../stats/chart-utils';

interface DayGridButtonProps {
  day: SevenDayActivity;
  onClick: () => void;
  isLogging: boolean;
}

export function DayGridButton({ day, onClick, isLogging }: DayGridButtonProps) {
  const dayAbbr = formatDayAbbreviation(day.dateObj);

  return (
    <button
      className={cn(
        'flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all',
        'hover:bg-black/10',
        day.hasActivity ? 'bg-black/10' : 'bg-black/5',
        isLogging && 'opacity-50 cursor-wait',
      )}
      disabled={isLogging}
      onClick={(e) => {
        e.stopPropagation();
        onClick();
      }}
      type="button"
    >
      <span className="text-xs font-semibold opacity-90">{dayAbbr}</span>
      <div
        className={cn(
          'flex size-10 items-center justify-center rounded-full transition-all',
          day.hasActivity ? 'bg-primary shadow-md' : 'bg-white/60 shadow-sm',
        )}
      >
        {day.hasActivity ? (
          <Check className="size-5 text-primary-foreground" strokeWidth={3} />
        ) : (
          <X className="size-5 text-red-600" strokeWidth={3} />
        )}
      </div>
    </button>
  );
}
