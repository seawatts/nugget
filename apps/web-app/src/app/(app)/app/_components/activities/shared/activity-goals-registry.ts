/**
 * Activity goals registry
 * Defines weekly goals and progress tracker visibility for each activity type
 */

export type ActivityGoalConfig = {
  getWeeklyGoal: (ageDays: number) => number;
  showProgressTracker: boolean; // false for daily activities like vitamin D
};

export const ACTIVITY_GOALS: Record<string, ActivityGoalConfig> = {
  bath: {
    getWeeklyGoal: (ageDays: number) => {
      if (ageDays <= 30) return 2; // Newborns: 2-3x/week
      if (ageDays <= 90) return 3; // Young babies: 3x/week
      return 3; // Older babies: 3x/week (can be 4)
    },
    showProgressTracker: true,
  },
  nail_trimming: {
    getWeeklyGoal: (ageDays: number) => {
      if (ageDays <= 30) return 2; // Newborns: 2x/week
      return 3; // Older babies: 3x/week
    },
    showProgressTracker: true,
  },
  vitamin_d: {
    getWeeklyGoal: () => 7, // Daily = 7 per week
    showProgressTracker: false, // Don't show tracker for daily activities
  },
};
