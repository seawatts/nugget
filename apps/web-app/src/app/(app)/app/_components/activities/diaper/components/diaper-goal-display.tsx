'use client';

interface DiaperGoalDisplayProps {
  currentCount: number;
  goalCount: number;
  wetCount: number;
  wetGoal: number;
  dirtyCount: number;
  dirtyGoal: number;
}

export function DiaperGoalDisplay({
  currentCount,
  goalCount,
  wetCount,
  wetGoal,
  dirtyCount,
  dirtyGoal,
}: DiaperGoalDisplayProps) {
  return (
    <div className="flex items-center justify-between pt-4 mt-4 border-t border-white/20">
      <div className="flex items-center gap-6">
        {/* Diaper Count */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">Changes</span>
          <span className="text-sm font-medium">
            {currentCount}/{goalCount}
          </span>
        </div>

        {/* Wet Count (Pees) */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">💧 Pees</span>
          <span className="text-sm font-medium">
            {wetCount}/{wetGoal}
          </span>
        </div>

        {/* Dirty Count (Poops) */}
        <div className="flex flex-col">
          <span className="text-xs opacity-60">💩 Poops</span>
          <span className="text-sm font-medium">
            {dirtyCount}/{dirtyGoal}
          </span>
        </div>
      </div>
    </div>
  );
}
