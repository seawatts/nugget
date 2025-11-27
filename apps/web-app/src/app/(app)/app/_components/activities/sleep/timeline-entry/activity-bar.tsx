'use client';

/**
 * ActivityBar Component
 * Reusable component for displaying individual activity bars on the timeline
 */

import type { Activities } from '@nugget/db/schema';
import { cn } from '@nugget/ui/lib/utils';
import type { ActivityPosition } from './utils/timeline-calculations';

interface ActivityBarProps {
  activity: typeof Activities.$inferSelect;
  colorVar: string; // CSS variable name (e.g., 'var(--activity-sleep)')
  colorClass: string; // Tailwind class for fallback
  label: string;
  position: ActivityPosition;
  tooltip: string;
  onClick?: () => void;
  laneIndex?: number;
  laneCount?: number;
}

export function ActivityBar({
  colorVar,
  colorClass,
  label,
  position,
  tooltip,
  onClick,
  laneCount = 1,
  laneIndex = 0,
}: ActivityBarProps) {
  const safeLaneCount = laneCount > 0 ? laneCount : 1;
  const laneWidthPercent = 100 / safeLaneCount;
  const laneLeftPercent = laneWidthPercent * (laneIndex ?? 0);
  const horizontalPadding = '0.25rem'; // matches previous left/right padding

  const barStyle = {
    backgroundColor: colorVar,
    height: `${position.heightPercent}%`,
    left:
      laneCount === 1
        ? horizontalPadding
        : `calc(${laneLeftPercent}% + ${horizontalPadding})`,
    minHeight: position.heightPercent < 1 ? '2px' : undefined,
    top: `${position.startPercent}%`,
    width:
      laneCount === 1
        ? `calc(100% - (${horizontalPadding} * 2))`
        : `calc(${laneWidthPercent}% - (${horizontalPadding} * 2))`,
  };

  return (
    <div
      className={cn(
        'absolute rounded-md transition-all cursor-pointer',
        'hover:brightness-110 hover:z-10',
        onClick && 'hover:ring-2 hover:ring-offset-1',
        colorClass,
      )}
      onClick={onClick}
      onKeyDown={(e) => {
        if (onClick && (e.key === 'Enter' || e.key === ' ')) {
          e.preventDefault();
          onClick();
        }
      }}
      role={onClick ? 'button' : undefined}
      style={barStyle}
      tabIndex={onClick ? 0 : undefined}
      title={tooltip}
    >
      {/* Optional: Show label if bar is tall enough */}
      <div
        className={cn(
          'absolute inset-0 flex items-center justify-center px-1 pointer-events-none',
          laneCount > 1 && 'px-0.5',
        )}
      >
        <span
          className={cn(
            'text-[10px] font-medium text-white drop-shadow-sm truncate',
            position.heightPercent <= 4 && 'absolute -top-4 text-[9px]',
          )}
        >
          {label}
        </span>
      </div>
    </div>
  );
}
