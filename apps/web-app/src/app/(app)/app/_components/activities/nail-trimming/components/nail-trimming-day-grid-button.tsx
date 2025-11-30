'use client';

import { cn } from '@nugget/ui/lib/utils';
import { Footprints, Hand } from 'lucide-react';
import { formatDayAbbreviation } from '../../shared/components/stats/chart-utils';

interface NailTrimmingDayGridButtonProps {
  date: string;
  dateObj: Date;
  isToday: boolean;
  hasHandsActivity: boolean;
  hasFeetActivity: boolean;
  isLoggingHands?: boolean;
  isLoggingFeet?: boolean;
  onHandsClick: () => void;
  onFeetClick: () => void;
}

export function NailTrimmingDayGridButton({
  dateObj,
  isToday,
  hasHandsActivity,
  hasFeetActivity,
  isLoggingHands = false,
  isLoggingFeet = false,
  onHandsClick,
  onFeetClick,
}: NailTrimmingDayGridButtonProps) {
  const dayAbbr = formatDayAbbreviation(dateObj);

  return (
    <div className="flex flex-col items-center gap-1.5 p-1.5 rounded-lg bg-black/5">
      <div className="flex flex-col items-center gap-0.5 min-h-[28px]">
        <span className="text-xs font-semibold opacity-90">{dayAbbr}</span>
        <span
          className={cn(
            'text-[10px] font-medium opacity-75 leading-none',
            !isToday && 'invisible',
          )}
        >
          Today
        </span>
      </div>

      {/* Pill-shaped buttons connected in middle */}
      <div className="flex flex-col w-full items-center gap-0">
        {/* Hands Button - top half of pill */}
        <button
          className={cn(
            'flex items-center justify-center transition-all relative w-full',
            'h-9',
            // Rounded top, straight bottom
            'rounded-t-lg',
            // Connected in middle - no gap
            hasHandsActivity ? 'bg-primary shadow-md' : 'bg-white/60 shadow-sm',
            isLoggingHands && 'opacity-50 cursor-wait',
            !isLoggingHands && !hasHandsActivity && 'hover:bg-white/80',
            !isLoggingHands && hasHandsActivity && 'hover:bg-primary/90',
          )}
          disabled={isLoggingHands}
          onClick={(e) => {
            e.stopPropagation();
            onHandsClick();
          }}
          title={hasHandsActivity ? 'Remove hands trim' : 'Log hands trim'}
          type="button"
        >
          <Hand
            className={cn(
              'size-4',
              hasHandsActivity
                ? 'text-primary-foreground/70'
                : 'text-foreground/60',
            )}
            strokeWidth={hasHandsActivity ? 3 : 2}
          />
        </button>

        {/* Feet/Toes Button - bottom half of pill */}
        <button
          className={cn(
            'flex items-center justify-center transition-all relative w-full',
            'h-9',
            // Rounded bottom, straight top (connected to hands button)
            'rounded-b-lg',
            // Seamlessly connected - overlap by 1px to eliminate gap
            '-mt-px',
            hasFeetActivity ? 'bg-primary shadow-md' : 'bg-white/60 shadow-sm',
            isLoggingFeet && 'opacity-50 cursor-wait',
            !isLoggingFeet && !hasFeetActivity && 'hover:bg-white/80',
            !isLoggingFeet && hasFeetActivity && 'hover:bg-primary/90',
          )}
          disabled={isLoggingFeet}
          onClick={(e) => {
            e.stopPropagation();
            onFeetClick();
          }}
          title={hasFeetActivity ? 'Remove toes trim' : 'Log toes trim'}
          type="button"
        >
          <Footprints
            className={cn(
              'size-4',
              hasFeetActivity
                ? 'text-primary-foreground/70'
                : 'text-foreground/60',
            )}
            strokeWidth={hasFeetActivity ? 3 : 2}
          />
        </button>
      </div>
    </div>
  );
}
