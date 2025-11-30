'use client';

import { mlToOz } from '../../shared/volume-utils';

interface FeedingGoalDisplayProps {
  currentCount: number;
  goalCount: number;
  currentAmount: number; // in ml
  goalAmount: number; // in user's preferred unit value
  unit: 'ML' | 'OZ';
  feedingThemeColor: string;
  yesterdayGoalCount?: number | null;
  yesterdayGoalAmount?: number | null;
}

export function FeedingGoalDisplay({
  currentCount,
  goalCount,
  currentAmount,
  goalAmount,
  unit,
  feedingThemeColor: _feedingThemeColor,
  yesterdayGoalCount,
  yesterdayGoalAmount,
}: FeedingGoalDisplayProps) {
  // Convert currentAmount from ml to user's preferred unit
  const displayAmount =
    unit === 'OZ' ? mlToOz(currentAmount) : Math.round(currentAmount);

  // Calculate goal comparisons
  const countDiff =
    yesterdayGoalCount !== null && yesterdayGoalCount !== undefined
      ? goalCount - yesterdayGoalCount
      : null;
  const amountDiff =
    yesterdayGoalAmount !== null && yesterdayGoalAmount !== undefined
      ? goalAmount - yesterdayGoalAmount
      : null;

  // Format inline comparison (e.g., "^2oz" or "v1")
  const formatInlineComparison = (diff: number | null, unitLabel: string) => {
    if (diff === null || diff === 0) return null;
    const arrow = diff > 0 ? '+' : '-';
    const absDiff = Math.abs(diff);
    if (unitLabel === 'oz' || unitLabel === 'ml') {
      return `${arrow}${absDiff}${unitLabel}`;
    }
    return `${arrow}${absDiff}`;
  };

  const countComparison = formatInlineComparison(countDiff, '');
  const amountComparison = formatInlineComparison(
    amountDiff,
    unit.toLowerCase(),
  );

  return (
    <div className="flex flex-col gap-2 pt-4 mt-4 border-t border-white/20">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-6">
          {/* Feeding Count */}
          <div className="flex flex-col">
            <span className="text-xs opacity-60">Feedings</span>
            <span className="text-sm font-medium">
              {currentCount}/{goalCount}
            </span>
            {countComparison && (
              <span className="text-xs opacity-70">
                Goal {goalCount} ({countComparison})
              </span>
            )}
          </div>

          {/* Amount */}
          <div className="flex flex-col">
            <span className="text-xs opacity-60">
              Amount ({unit.toLowerCase()})
            </span>
            <span className="text-sm font-medium">
              {displayAmount}/{goalAmount}
            </span>
            {amountComparison && (
              <span className="text-xs opacity-70">
                Goal {goalAmount}
                {unit.toLowerCase()} ({amountComparison})
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
