'use client';

import { mlToOz } from '../../shared/volume-utils';

interface FeedingGoalDisplayProps {
  currentCount: number;
  goalCount: number;
  currentAmount: number; // in ml
  goalAmount: number; // in user's preferred unit value
  unit: 'ML' | 'OZ';
  feedingThemeColor: string;
  currentVitaminDCount: number;
}

export function FeedingGoalDisplay({
  currentCount,
  goalCount,
  currentAmount,
  goalAmount,
  unit,
  feedingThemeColor: _feedingThemeColor,
  currentVitaminDCount,
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
          <span className="text-sm font-medium">
            {currentCount}/{goalCount}
          </span>
        </div>

        {/* Amount */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">
            Amount ({unit.toLowerCase()})
          </span>
          <span className="text-sm font-medium">
            {displayAmount}/{goalAmount}
          </span>
        </div>

        {/* Vitamin D */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Vitamin D</span>
          <span className="text-sm font-medium">{currentVitaminDCount}/1</span>
        </div>
      </div>
    </div>
  );
}
