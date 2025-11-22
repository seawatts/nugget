'use client';

interface FeedingGoalDisplayProps {
  currentCount: number;
  goalCount: number;
  currentAmount: number; // in ml
  goalAmount: number; // in user's preferred unit value
  avgIntervalHours: number | null;
  unit: 'ML' | 'OZ';
  feedingThemeColor: string;
}

export function FeedingGoalDisplay({
  currentCount,
  goalCount,
  currentAmount,
  goalAmount,
  avgIntervalHours,
  unit,
  feedingThemeColor: _feedingThemeColor,
}: FeedingGoalDisplayProps) {
  // Convert currentAmount from ml to user's preferred unit
  const displayAmount =
    unit === 'OZ'
      ? Math.round((currentAmount / 29.5735) * 10) / 10 // Round to 1 decimal
      : Math.round(currentAmount);

  // Format average interval
  const avgIntervalDisplay = avgIntervalHours
    ? `${Math.round(avgIntervalHours * 10) / 10}h` // Round to 1 decimal
    : '--';

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
          <span className="text-xs opacity-60">Amount</span>
          <span className="text-sm font-medium">
            {displayAmount}/{goalAmount}
            {unit.toLowerCase()}
          </span>
        </div>

        {/* Average Interval */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Avg</span>
          <span className="text-sm font-medium">{avgIntervalDisplay}</span>
        </div>
      </div>
    </div>
  );
}
