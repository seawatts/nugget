'use client';

interface SleepGoalDisplayProps {
  napCount: number;
  napGoal: number;
  totalSleepMinutes: number;
  sleepHoursGoal: number;
}

export function SleepGoalDisplay({
  napCount,
  napGoal,
  totalSleepMinutes,
  sleepHoursGoal,
}: SleepGoalDisplayProps) {
  // Round total sleep to nearest hour
  const roundedHours = Math.round(totalSleepMinutes / 60);

  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/20">
      <div className="flex items-center gap-6">
        {/* Nap Count */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Naps</span>
          <span className="text-sm font-medium">
            {napCount}/{napGoal}
          </span>
        </div>

        {/* Total Sleep */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Total (h)</span>
          <span className="text-sm font-medium">
            {roundedHours}/{sleepHoursGoal}
          </span>
        </div>
      </div>
    </div>
  );
}
