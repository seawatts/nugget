'use client';

interface FeedingGoalDisplayProps {
  currentCount: number;
  goalCount: number;
  currentAmount: number; // in ml
  goalAmount: number; // in user's preferred unit value
  avgAmountMl: number | null;
  unit: 'ML' | 'OZ';
  feedingThemeColor: string;
}

export function FeedingGoalDisplay({
  currentCount,
  goalCount,
  currentAmount,
  goalAmount,
  avgAmountMl,
  unit,
  feedingThemeColor: _feedingThemeColor,
}: FeedingGoalDisplayProps) {
  // Convert currentAmount from ml to user's preferred unit
  const displayAmount =
    unit === 'OZ'
      ? Math.round((currentAmount / 29.5735) * 10) / 10 // Round to 1 decimal
      : Math.round(currentAmount);

  // Format average amount
  const avgAmountDisplay = avgAmountMl
    ? unit === 'OZ'
      ? `${Math.round((avgAmountMl / 29.5735) * 10) / 10}${unit.toLowerCase()}` // Round to 1 decimal
      : `${Math.round(avgAmountMl)}${unit.toLowerCase()}`
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

        {/* Average Amount */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Avg</span>
          <span className="text-sm font-medium">{avgAmountDisplay}</span>
        </div>
      </div>
    </div>
  );
}
