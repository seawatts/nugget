/**
 * Activity goals registry
 * Defines weekly goals and progress tracker visibility for each activity type
 */

export type ActivityGoalConfig = {
  getWeeklyGoal: (ageDays: number) => number;
  showProgressTracker: boolean; // whether to show the weekly progress tracker
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
  contrast_time: {
    getWeeklyGoal: () => 7, // Daily contrast time recommended
    showProgressTracker: true,
  },
  nail_trimming: {
    getWeeklyGoal: (ageDays: number) => {
      if (ageDays <= 30) return 2; // Newborns: 2x/week
      return 3; // Older babies: 3x/week
    },
    showProgressTracker: true,
  },
  stroller_walk: {
    getWeeklyGoal: () => 7, // 7 per week (daily walks)
    showProgressTracker: true,
  },
  tummy_time: {
    getWeeklyGoal: () => 7, // 7 per week (daily tummy time)
    showProgressTracker: true,
  },
  vitamin_d: {
    getWeeklyGoal: () => 7, // 7 per week
    showProgressTracker: true,
  },
};
