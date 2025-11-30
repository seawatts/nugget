import type { Milestones } from '../types';

/**
 * Calculate milestones
 */
export function calculateMilestones(
  totalActivities: number,
  totalVolumeMl: number,
  totalDiapers: number,
  daysTracking: number,
): Milestones {
  const activityMilestones = [100, 500, 1000, 2500, 5000];
  const volumeMilestones = [1000, 5000, 10000, 25000, 50000]; // in ml
  const diaperMilestones = [100, 500, 1000, 2500, 5000];
  const daysMilestones = [7, 30, 100, 365, 730];

  const getMilestone = (
    value: number,
    milestones: number[],
  ): { next: number; progress: number; reached: number } | null => {
    const reached = milestones.filter((m) => value >= m).pop() || 0;
    const next = milestones.find((m) => m > value);
    if (!next) return null;
    const progress = ((value - reached) / (next - reached)) * 100;
    return { next, progress, reached };
  };

  return {
    activityMilestone: getMilestone(totalActivities, activityMilestones),
    daysMilestone: getMilestone(daysTracking, daysMilestones),
    diaperMilestone: getMilestone(totalDiapers, diaperMilestones),
    volumeMilestone: getMilestone(totalVolumeMl, volumeMilestones),
  };
}
