'use client';

import { mlToOz } from '../../shared/volume-utils';

interface PumpingGoalDisplayProps {
  currentCount: number;
  goalCount: number;
  currentAmount: number; // in ml
  goalAmount: number; // in user's preferred unit value
  unit: 'ML' | 'OZ';
}

export function PumpingGoalDisplay({
  currentCount,
  goalCount,
  currentAmount,
  goalAmount,
  unit,
}: PumpingGoalDisplayProps) {
  // Convert currentAmount from ml to user's preferred unit
  const displayAmount =
    unit === 'OZ' ? mlToOz(currentAmount) : Math.round(currentAmount);

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/20">
      <div className="flex items-center gap-6">
        {/* Pumping Count */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Sessions</span>
          <span className="text-sm font-medium">
            {currentCount}/{goalCount}
          </span>
        </div>

        {/* Amount */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Amount</span>
          <span className="text-sm font-medium">
            {displayAmount}/{goalAmount}
            {unit.toLowerCase()}
          </span>
        </div>
      </div>
    </div>
  );
}
