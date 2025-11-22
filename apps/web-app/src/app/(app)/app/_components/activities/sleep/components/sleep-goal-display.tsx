'use client';

interface SleepGoalDisplayProps {
  napCount: number;
  napGoal: number;
  totalSleepMinutes: number;
  sleepHoursGoal: number;
  avgNapDuration: number | null;
  longestNapMinutes: number | null;
}

export function SleepGoalDisplay({
  napCount,
  napGoal,
  totalSleepMinutes,
  sleepHoursGoal,
  avgNapDuration,
  longestNapMinutes,
}: SleepGoalDisplayProps) {
  // Format total sleep hours
  const totalHours = Math.floor(totalSleepMinutes / 60);
  const totalMins = totalSleepMinutes % 60;
  const totalSleepDisplay =
    totalMins > 0 ? `${totalHours}h ${totalMins}m` : `${totalHours}h`;

  // Format average nap duration
  const avgNapDisplay = avgNapDuration
    ? (() => {
        const hours = Math.floor(avgNapDuration / 60);
        const mins = Math.round(avgNapDuration % 60);
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      })()
    : '--';

  // Format longest nap
  const longestNapDisplay = longestNapMinutes
    ? (() => {
        const hours = Math.floor(longestNapMinutes / 60);
        const mins = longestNapMinutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
      })()
    : '--';

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
          <span className="text-xs opacity-60">Total</span>
          <span className="text-sm font-medium">
            {totalSleepDisplay}/{sleepHoursGoal}h
          </span>
        </div>

        {/* Average Nap */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Avg Nap</span>
          <span className="text-sm font-medium">{avgNapDisplay}</span>
        </div>

        {/* Longest Nap */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Longest</span>
          <span className="text-sm font-medium">{longestNapDisplay}</span>
        </div>
      </div>
    </div>
  );
}
