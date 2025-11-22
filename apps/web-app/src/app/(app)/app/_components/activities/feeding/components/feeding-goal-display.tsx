'use client';

import { ArrowDown, ArrowUp } from 'lucide-react';
import { mlToOz } from '../../shared/volume-utils';

interface FeedingGoalDisplayProps {
  currentCount: number;
  goalCount: number;
  currentAmount: number; // in ml
  goalAmount: number; // in user's preferred unit value
  unit: 'ML' | 'OZ';
  feedingThemeColor: string;
  countChange?: number | null;
  amountChange?: number | null;
  currentVitaminDCount: number;
  vitaminDChange?: number | null;
}

interface PercentageIndicatorProps {
  change: number | null | undefined;
}

function PercentageIndicator({ change }: PercentageIndicatorProps) {
  if (change === null || change === undefined) {
    return null;
  }

  const isPositive = change > 0;
  const isNegative = change < 0;
  const Icon = isPositive ? ArrowUp : ArrowDown;
  const colorClass = isPositive
    ? 'text-green-400'
    : isNegative
      ? 'text-red-400'
      : 'text-muted-foreground';

  return (
    <span className={`flex items-center gap-0.5 text-xs ${colorClass}`}>
      <Icon className="size-3" />
      {Math.abs(change).toFixed(0)}%
    </span>
  );
}

export function FeedingGoalDisplay({
  currentCount,
  goalCount,
  currentAmount,
  goalAmount,
  unit,
  feedingThemeColor: _feedingThemeColor,
  countChange,
  amountChange,
  currentVitaminDCount,
  vitaminDChange,
}: FeedingGoalDisplayProps) {
  // Convert currentAmount from ml to user's preferred unit
  const displayAmount =
    unit === 'OZ' ? mlToOz(currentAmount) : Math.round(currentAmount);

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/20">
      <div className="flex items-center gap-6">
        {/* Feeding Count */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Feedings</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">
              {currentCount}/{goalCount}
            </span>
            <PercentageIndicator change={countChange} />
          </div>
        </div>

        {/* Amount */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">
            Amount ({unit.toLowerCase()})
          </span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">
              {displayAmount}/{goalAmount}
            </span>
            <PercentageIndicator change={amountChange} />
          </div>
        </div>

        {/* Vitamin D */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Vitamin D</span>
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-medium">
              {currentVitaminDCount}/1
            </span>
            <PercentageIndicator change={vitaminDChange} />
          </div>
        </div>
      </div>
    </div>
  );
}
