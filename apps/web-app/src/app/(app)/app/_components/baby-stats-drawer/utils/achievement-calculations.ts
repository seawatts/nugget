import type { Activities } from '@nugget/db/schema';
import { differenceInDays } from 'date-fns';
import type { Achievement, Streaks } from '../types';
import {
  getActivitiesWithNotesCount,
  getActivityCounts,
  getConsecutiveTrackingDays,
  getDaySleepCount,
  getDaysSurvived,
  getEarlyBirdActivities,
  getFirstActivityDate,
  getLongestSleep,
  getMostActiveDay,
  getMostFeedingsInDay,
  getMultiTaskerHours,
  getNightOwlActivities,
  getNightSleepCount,
  getNightsWithLateActivities,
  getNightsWithMultipleWakeups,
  getParentFirsts,
  getQuickLogCount,
  getSleepDeprivationActivityCount,
  getTotalSleepHours,
  getWeekendActivityCount,
  hasLoggedActivityType,
} from './achievement-helpers';

/**
 * Comprehensive achievement calculation system
 * Organized by category with progressive difficulty
 */

interface AchievementCalculationParams {
  activities: Array<typeof Activities.$inferSelect>;
  streaks: Streaks;
  babyBirthDate?: Date | null;
}

/**
 * Calculate all achievements
 */
export function calculateAchievements(
  totalActivities: number,
  totalVolumeMl: number,
  totalDiapers: number,
  daysTracking: number,
  streaks: Streaks,
  activities: Array<typeof Activities.$inferSelect>,
  babyBirthDate?: Date | null,
): Array<Achievement> {
  const params: AchievementCalculationParams = {
    activities,
    babyBirthDate,
    streaks,
  };

  const allAchievements: Array<Achievement> = [
    ...calculateFoundationAchievements(params),
    ...calculateVolumeAchievements(
      totalActivities,
      totalVolumeMl,
      totalDiapers,
    ),
    ...calculateStreakAchievements(streaks),
    ...calculateActivitySpecificAchievements(params),
    ...calculateEfficiencyAchievements(params),
    ...calculateRecordAchievements(params),
    ...calculateTimeBasedAchievements(params, daysTracking),
    ...calculateSpecialAchievements(params),
    ...calculatePersonalMilestoneAchievements(params, daysTracking),
    ...calculateParentMilestoneAchievements(params, daysTracking),
  ];

  return allAchievements;
}

/**
 * 1. Foundation Milestones (Easy Early Wins)
 */
function calculateFoundationAchievements(
  params: AchievementCalculationParams,
): Array<Achievement> {
  const { activities } = params;
  const firstActivityDate = getFirstActivityDate(activities);
  const hasFeeding =
    hasLoggedActivityType(activities, 'bottle') ||
    hasLoggedActivityType(activities, 'nursing') ||
    hasLoggedActivityType(activities, 'feeding');
  const hasSleep = hasLoggedActivityType(activities, 'sleep');
  const hasDiaper =
    hasLoggedActivityType(activities, 'diaper') ||
    hasLoggedActivityType(activities, 'wet') ||
    hasLoggedActivityType(activities, 'dirty');

  const daysSinceFirst = firstActivityDate
    ? differenceInDays(new Date(), firstActivityDate)
    : 0;

  return [
    {
      category: 'foundation',
      description: 'Log your very first activity',
      earned: activities.length >= 1,
      icon: '🎉',
      id: 'first-activity',
      name: 'First Activity',
      progress: Math.min(100, (activities.length / 1) * 100),
      rarity: 'common',
      target: 1,
      unlockedAt: firstActivityDate || undefined,
    },
    {
      category: 'foundation',
      description: 'Log your first feeding',
      earned: hasFeeding,
      icon: '🍼',
      id: 'first-feeding',
      name: 'First Feeding',
      progress: hasFeeding ? 100 : 0,
      rarity: 'common',
      target: 1,
    },
    {
      category: 'foundation',
      description: 'Log your first sleep session',
      earned: hasSleep,
      icon: '🌙',
      id: 'first-sleep',
      name: 'First Sleep',
      progress: hasSleep ? 100 : 0,
      rarity: 'common',
      target: 1,
    },
    {
      category: 'foundation',
      description: 'Log your first diaper change',
      earned: hasDiaper,
      icon: '👶',
      id: 'first-diaper',
      name: 'First Diaper',
      progress: hasDiaper ? 100 : 0,
      rarity: 'common',
      target: 1,
    },
    {
      category: 'foundation',
      description: 'Track for a full week',
      earned: daysSinceFirst >= 7,
      icon: '📆',
      id: 'first-week',
      name: 'First Week',
      progress: Math.min(100, (daysSinceFirst / 7) * 100),
      rarity: 'common',
      target: 7,
    },
    {
      category: 'foundation',
      description: 'Track for a full month',
      earned: daysSinceFirst >= 30,
      icon: '📅',
      id: 'first-month',
      name: 'First Month',
      progress: Math.min(100, (daysSinceFirst / 30) * 100),
      rarity: 'rare',
      target: 30,
    },
  ];
}

/**
 * 2. Volume & Quantity Milestones (Progressive Difficulty)
 */
function calculateVolumeAchievements(
  totalActivities: number,
  totalVolumeMl: number,
  totalDiapers: number,
): Array<Achievement> {
  const achievements: Array<Achievement> = [
    // Total Activities
    {
      category: 'volume',
      description: 'Log 10 activities',
      earned: totalActivities >= 10,
      icon: '🎯',
      id: '10-activities',
      name: '10 Activities',
      progress: Math.min(100, (totalActivities / 10) * 100),
      rarity: 'common',
      target: 10,
    },
    {
      category: 'volume',
      description: 'Log 25 activities',
      earned: totalActivities >= 25,
      icon: '🎯',
      id: '25-activities',
      name: '25 Activities',
      progress: Math.min(100, (totalActivities / 25) * 100),
      rarity: 'common',
      target: 25,
    },
    {
      category: 'volume',
      description: 'Log 50 activities',
      earned: totalActivities >= 50,
      icon: '🎯',
      id: '50-activities',
      name: '50 Activities',
      progress: Math.min(100, (totalActivities / 50) * 100),
      rarity: 'common',
      target: 50,
    },
    {
      category: 'volume',
      description: 'Log 100 activities',
      earned: totalActivities >= 100,
      icon: '🎯',
      id: '100-activities',
      name: '100 Activities',
      progress: Math.min(100, (totalActivities / 100) * 100),
      rarity: 'rare',
      target: 100,
    },
    {
      category: 'volume',
      description: 'Log 250 activities',
      earned: totalActivities >= 250,
      icon: '🏆',
      id: '250-activities',
      name: '250 Activities',
      progress: Math.min(100, (totalActivities / 250) * 100),
      rarity: 'rare',
      target: 250,
    },
    {
      category: 'volume',
      description: 'Log 500 activities',
      earned: totalActivities >= 500,
      icon: '🏆',
      id: '500-activities',
      name: '500 Activities',
      progress: Math.min(100, (totalActivities / 500) * 100),
      rarity: 'epic',
      target: 500,
    },
    {
      category: 'volume',
      description: 'Log 1,000 activities',
      earned: totalActivities >= 1000,
      icon: '⭐',
      id: '1000-activities',
      name: '1,000 Activities',
      progress: Math.min(100, (totalActivities / 1000) * 100),
      rarity: 'epic',
      target: 1000,
    },
    {
      category: 'volume',
      description: 'Log 2,500 activities',
      earned: totalActivities >= 2500,
      icon: '💎',
      id: '2500-activities',
      name: '2,500 Activities',
      progress: Math.min(100, (totalActivities / 2500) * 100),
      rarity: 'legendary',
      target: 2500,
    },
    {
      category: 'volume',
      description: 'Log 5,000 activities',
      earned: totalActivities >= 5000,
      icon: '👑',
      id: '5000-activities',
      name: '5,000 Activities',
      progress: Math.min(100, (totalActivities / 5000) * 100),
      rarity: 'legendary',
      target: 5000,
    },
    {
      category: 'volume',
      description: 'Log 10,000 activities',
      earned: totalActivities >= 10000,
      icon: '🌟',
      id: '10000-activities',
      name: '10,000 Activities',
      progress: Math.min(100, (totalActivities / 10000) * 100),
      rarity: 'legendary',
      target: 10000,
    },
    // Feeding Volume (in ML)
    {
      category: 'volume',
      description: 'Feed 1 liter total',
      earned: totalVolumeMl >= 1000,
      icon: '🥛',
      id: '1l-fed',
      name: '1L Fed',
      progress: Math.min(100, (totalVolumeMl / 1000) * 100),
      rarity: 'common',
      target: 1000,
    },
    {
      category: 'volume',
      description: 'Feed 5 liters total',
      earned: totalVolumeMl >= 5000,
      icon: '🥛',
      id: '5l-fed',
      name: '5L Fed',
      progress: Math.min(100, (totalVolumeMl / 5000) * 100),
      rarity: 'rare',
      target: 5000,
    },
    {
      category: 'volume',
      description: 'Feed 10 liters total',
      earned: totalVolumeMl >= 10000,
      icon: '🥛',
      id: '10l-fed',
      name: '10L Fed',
      progress: Math.min(100, (totalVolumeMl / 10000) * 100),
      rarity: 'rare',
      target: 10000,
    },
    {
      category: 'volume',
      description: 'Feed 25 liters total',
      earned: totalVolumeMl >= 25000,
      icon: '🥛',
      id: '25l-fed',
      name: '25L Fed',
      progress: Math.min(100, (totalVolumeMl / 25000) * 100),
      rarity: 'epic',
      target: 25000,
    },
    {
      category: 'volume',
      description: 'Feed 50 liters total',
      earned: totalVolumeMl >= 50000,
      icon: '🥛',
      id: '50l-fed',
      name: '50L Fed',
      progress: Math.min(100, (totalVolumeMl / 50000) * 100),
      rarity: 'epic',
      target: 50000,
    },
    {
      category: 'volume',
      description: 'Feed 100 liters total',
      earned: totalVolumeMl >= 100000,
      icon: '🥛',
      id: '100l-fed',
      name: '100L Fed',
      progress: Math.min(100, (totalVolumeMl / 100000) * 100),
      rarity: 'legendary',
      target: 100000,
    },
    // Diaper Counts
    {
      category: 'volume',
      description: 'Change 50 diapers',
      earned: totalDiapers >= 50,
      icon: '👶',
      id: '50-diapers',
      name: '50 Diapers',
      progress: Math.min(100, (totalDiapers / 50) * 100),
      rarity: 'common',
      target: 50,
    },
    {
      category: 'volume',
      description: 'Change 100 diapers',
      earned: totalDiapers >= 100,
      icon: '👶',
      id: '100-diapers',
      name: '100 Diapers',
      progress: Math.min(100, (totalDiapers / 100) * 100),
      rarity: 'common',
      target: 100,
    },
    {
      category: 'volume',
      description: 'Change 250 diapers',
      earned: totalDiapers >= 250,
      icon: '👶',
      id: '250-diapers',
      name: '250 Diapers',
      progress: Math.min(100, (totalDiapers / 250) * 100),
      rarity: 'rare',
      target: 250,
    },
    {
      category: 'volume',
      description: 'Change 500 diapers',
      earned: totalDiapers >= 500,
      icon: '👶',
      id: '500-diapers',
      name: '500 Diapers',
      progress: Math.min(100, (totalDiapers / 500) * 100),
      rarity: 'rare',
      target: 500,
    },
    {
      category: 'volume',
      description: 'Change 1,000 diapers',
      earned: totalDiapers >= 1000,
      icon: '👶',
      id: '1000-diapers',
      name: '1,000 Diapers',
      progress: Math.min(100, (totalDiapers / 1000) * 100),
      rarity: 'epic',
      target: 1000,
    },
    {
      category: 'volume',
      description: 'Change 2,500 diapers',
      earned: totalDiapers >= 2500,
      icon: '👶',
      id: '2500-diapers',
      name: '2,500 Diapers',
      progress: Math.min(100, (totalDiapers / 2500) * 100),
      rarity: 'legendary',
      target: 2500,
    },
  ];

  return achievements;
}

/**
 * 3. Streak Achievements (Consistency)
 */
function calculateStreakAchievements(streaks: Streaks): Array<Achievement> {
  return [
    // Feeding Streaks
    {
      category: 'streaks',
      description: 'Feed for 3 days in a row',
      earned: streaks.feeding.current >= 3,
      icon: '🔥',
      id: '3-day-feeding',
      name: '3-Day Feeding Streak',
      progress: Math.min(100, (streaks.feeding.current / 3) * 100),
      rarity: 'common',
      target: 3,
    },
    {
      category: 'streaks',
      description: 'Feed for 7 days in a row',
      earned: streaks.feeding.current >= 7,
      icon: '🔥',
      id: '7-day-feeding',
      name: '7-Day Feeding Streak',
      progress: Math.min(100, (streaks.feeding.current / 7) * 100),
      rarity: 'rare',
      target: 7,
    },
    {
      category: 'streaks',
      description: 'Feed for 14 days in a row',
      earned: streaks.feeding.current >= 14,
      icon: '🔥',
      id: '14-day-feeding',
      name: '14-Day Feeding Streak',
      progress: Math.min(100, (streaks.feeding.current / 14) * 100),
      rarity: 'epic',
      target: 14,
    },
    {
      category: 'streaks',
      description: 'Feed for 30 days in a row',
      earned: streaks.feeding.current >= 30,
      icon: '🔥',
      id: '30-day-feeding',
      name: '30-Day Feeding Streak',
      progress: Math.min(100, (streaks.feeding.current / 30) * 100),
      rarity: 'legendary',
      target: 30,
    },
    // Diaper Streaks
    {
      category: 'streaks',
      description: 'Change diapers for 3 days in a row',
      earned: streaks.diaper.current >= 3,
      icon: '🔥',
      id: '3-day-diaper',
      name: '3-Day Diaper Streak',
      progress: Math.min(100, (streaks.diaper.current / 3) * 100),
      rarity: 'common',
      target: 3,
    },
    {
      category: 'streaks',
      description: 'Change diapers for 7 days in a row',
      earned: streaks.diaper.current >= 7,
      icon: '🔥',
      id: '7-day-diaper',
      name: '7-Day Diaper Streak',
      progress: Math.min(100, (streaks.diaper.current / 7) * 100),
      rarity: 'rare',
      target: 7,
    },
    {
      category: 'streaks',
      description: 'Change diapers for 30 days in a row',
      earned: streaks.diaper.current >= 30,
      icon: '🔥',
      id: '30-day-diaper',
      name: '30-Day Diaper Streak',
      progress: Math.min(100, (streaks.diaper.current / 30) * 100),
      rarity: 'epic',
      target: 30,
    },
    // Sleep Streaks
    {
      category: 'streaks',
      description: 'Track sleep for 3 days in a row',
      earned: streaks.sleep.current >= 3,
      icon: '🌙',
      id: '3-day-sleep',
      name: '3-Day Sleep Streak',
      progress: Math.min(100, (streaks.sleep.current / 3) * 100),
      rarity: 'common',
      target: 3,
    },
    {
      category: 'streaks',
      description: 'Track sleep for 7 days in a row',
      earned: streaks.sleep.current >= 7,
      icon: '🌙',
      id: '7-day-sleep',
      name: '7-Day Sleep Streak',
      progress: Math.min(100, (streaks.sleep.current / 7) * 100),
      rarity: 'rare',
      target: 7,
    },
    {
      category: 'streaks',
      description: 'Track sleep for 30 days in a row',
      earned: streaks.sleep.current >= 30,
      icon: '🌙',
      id: '30-day-sleep',
      name: '30-Day Sleep Streak',
      progress: Math.min(100, (streaks.sleep.current / 30) * 100),
      rarity: 'epic',
      target: 30,
    },
    // Perfect Day Streaks
    {
      category: 'streaks',
      description: 'Have 3 perfect days in a row',
      earned: streaks.perfectDay.current >= 3,
      icon: '✨',
      id: '3-perfect-days',
      name: '3 Perfect Days',
      progress: Math.min(100, (streaks.perfectDay.current / 3) * 100),
      rarity: 'rare',
      target: 3,
    },
    {
      category: 'streaks',
      description: 'Have 7 perfect days in a row',
      earned: streaks.perfectDay.current >= 7,
      icon: '✨',
      id: '7-perfect-days',
      name: '7 Perfect Days',
      progress: Math.min(100, (streaks.perfectDay.current / 7) * 100),
      rarity: 'epic',
      target: 7,
    },
    {
      category: 'streaks',
      description: 'Have 14 perfect days in a row',
      earned: streaks.perfectDay.current >= 14,
      icon: '✨',
      id: '14-perfect-days',
      name: '14 Perfect Days',
      progress: Math.min(100, (streaks.perfectDay.current / 14) * 100),
      rarity: 'legendary',
      target: 14,
    },
    {
      category: 'streaks',
      description: 'Have 30 perfect days in a row',
      earned: streaks.perfectDay.current >= 30,
      icon: '✨',
      id: '30-perfect-days',
      name: '30 Perfect Days',
      progress: Math.min(100, (streaks.perfectDay.current / 30) * 100),
      rarity: 'legendary',
      target: 30,
    },
  ];
}

/**
 * 4. Activity-Specific Achievements (Exploration)
 */
function calculateActivitySpecificAchievements(
  params: AchievementCalculationParams,
): Array<Achievement> {
  const { activities } = params;
  const counts = getActivityCounts(activities);

  return [
    // Bath
    {
      category: 'activity-specific',
      description: 'Give 10 baths',
      earned: counts.bath >= 10,
      icon: '🛁',
      id: '10-baths',
      name: 'Bath Beginner',
      progress: Math.min(100, (counts.bath / 10) * 100),
      rarity: 'common',
      target: 10,
    },
    {
      category: 'activity-specific',
      description: 'Give 25 baths',
      earned: counts.bath >= 25,
      icon: '🛁',
      id: '25-baths',
      name: 'Bath Master',
      progress: Math.min(100, (counts.bath / 25) * 100),
      rarity: 'rare',
      target: 25,
    },
    {
      category: 'activity-specific',
      description: 'Give 50 baths',
      earned: counts.bath >= 50,
      icon: '🛁',
      id: '50-baths',
      name: 'Bath Expert',
      progress: Math.min(100, (counts.bath / 50) * 100),
      rarity: 'epic',
      target: 50,
    },
    // Vitamin D
    {
      category: 'activity-specific',
      description: 'Give 30 vitamin D doses',
      earned: counts.vitaminD >= 30,
      icon: '💊',
      id: '30-vitamin-d',
      name: 'Vitamin D Champion',
      progress: Math.min(100, (counts.vitaminD / 30) * 100),
      rarity: 'rare',
      target: 30,
    },
    {
      category: 'activity-specific',
      description: 'Give 100 vitamin D doses',
      earned: counts.vitaminD >= 100,
      icon: '💊',
      id: '100-vitamin-d',
      name: 'Vitamin D Pro',
      progress: Math.min(100, (counts.vitaminD / 100) * 100),
      rarity: 'epic',
      target: 100,
    },
    // Stroller Walk
    {
      category: 'activity-specific',
      description: 'Go on 25 stroller walks',
      earned: counts.strollerWalk >= 25,
      icon: '🚶',
      id: '25-stroller-walks',
      name: 'Stroller Walk Enthusiast',
      progress: Math.min(100, (counts.strollerWalk / 25) * 100),
      rarity: 'rare',
      target: 25,
    },
    {
      category: 'activity-specific',
      description: 'Go on 50 stroller walks',
      earned: counts.strollerWalk >= 50,
      icon: '🚶',
      id: '50-stroller-walks',
      name: 'Stroller Walk Lover',
      progress: Math.min(100, (counts.strollerWalk / 50) * 100),
      rarity: 'epic',
      target: 50,
    },
    {
      category: 'activity-specific',
      description: 'Go on 100 stroller walks',
      earned: counts.strollerWalk >= 100,
      icon: '🚶',
      id: '100-stroller-walks',
      name: 'Stroller Walk Master',
      progress: Math.min(100, (counts.strollerWalk / 100) * 100),
      rarity: 'legendary',
      target: 100,
    },
    // Tummy Time
    {
      category: 'activity-specific',
      description: 'Complete 50 tummy time sessions',
      earned: counts.tummyTime >= 50,
      icon: '🤸',
      id: '50-tummy-time',
      name: 'Tummy Time Pro',
      progress: Math.min(100, (counts.tummyTime / 50) * 100),
      rarity: 'rare',
      target: 50,
    },
    {
      category: 'activity-specific',
      description: 'Complete 100 tummy time sessions',
      earned: counts.tummyTime >= 100,
      icon: '🤸',
      id: '100-tummy-time',
      name: 'Tummy Time Expert',
      progress: Math.min(100, (counts.tummyTime / 100) * 100),
      rarity: 'epic',
      target: 100,
    },
    // Solids
    {
      category: 'activity-specific',
      description: 'Feed first solid meal',
      earned: counts.solids >= 1,
      icon: '🥄',
      id: 'first-solids',
      name: 'Solids Starter',
      progress: Math.min(100, (counts.solids / 1) * 100),
      rarity: 'common',
      target: 1,
    },
    {
      category: 'activity-specific',
      description: 'Feed 50 solid meals',
      earned: counts.solids >= 50,
      icon: '🥄',
      id: '50-solids',
      name: 'Solids Explorer',
      progress: Math.min(100, (counts.solids / 50) * 100),
      rarity: 'rare',
      target: 50,
    },
    {
      category: 'activity-specific',
      description: 'Feed 100 solid meals',
      earned: counts.solids >= 100,
      icon: '🥄',
      id: '100-solids',
      name: 'Solids Master',
      progress: Math.min(100, (counts.solids / 100) * 100),
      rarity: 'epic',
      target: 100,
    },
    // Pumping
    {
      category: 'activity-specific',
      description: 'Pump 25 times',
      earned: counts.pumping >= 25,
      icon: '🍼',
      id: '25-pumping',
      name: 'Pumping Champion',
      progress: Math.min(100, (counts.pumping / 25) * 100),
      rarity: 'rare',
      target: 25,
    },
    {
      category: 'activity-specific',
      description: 'Pump 50 times',
      earned: counts.pumping >= 50,
      icon: '🍼',
      id: '50-pumping',
      name: 'Pumping Pro',
      progress: Math.min(100, (counts.pumping / 50) * 100),
      rarity: 'epic',
      target: 50,
    },
    {
      category: 'activity-specific',
      description: 'Pump 100 times',
      earned: counts.pumping >= 100,
      icon: '🍼',
      id: '100-pumping',
      name: 'Pumping Master',
      progress: Math.min(100, (counts.pumping / 100) * 100),
      rarity: 'legendary',
      target: 100,
    },
    // Doctor Visits
    {
      category: 'activity-specific',
      description: 'Log 5 doctor visits',
      earned: counts.doctorVisit >= 5,
      icon: '🏥',
      id: '5-doctor-visits',
      name: 'Doctor Visit Veteran',
      progress: Math.min(100, (counts.doctorVisit / 5) * 100),
      rarity: 'rare',
      target: 5,
    },
    {
      category: 'activity-specific',
      description: 'Log 10 doctor visits',
      earned: counts.doctorVisit >= 10,
      icon: '🏥',
      id: '10-doctor-visits',
      name: 'Doctor Visit Expert',
      progress: Math.min(100, (counts.doctorVisit / 10) * 100),
      rarity: 'epic',
      target: 10,
    },
    // Nail Trimming
    {
      category: 'activity-specific',
      description: 'Trim nails 10 times',
      earned: counts.nailTrimming >= 10,
      icon: '✂️',
      id: '10-nail-trimming',
      name: 'Nail Trimming Expert',
      progress: Math.min(100, (counts.nailTrimming / 10) * 100),
      rarity: 'rare',
      target: 10,
    },
    {
      category: 'activity-specific',
      description: 'Trim nails 25 times',
      earned: counts.nailTrimming >= 25,
      icon: '✂️',
      id: '25-nail-trimming',
      name: 'Nail Trimming Master',
      progress: Math.min(100, (counts.nailTrimming / 25) * 100),
      rarity: 'epic',
      target: 25,
    },
    // Contrast Time
    {
      category: 'activity-specific',
      description: 'Complete 25 contrast time sessions',
      earned: counts.contrastTime >= 25,
      icon: '🎨',
      id: '25-contrast-time',
      name: 'Contrast Time Advocate',
      progress: Math.min(100, (counts.contrastTime / 25) * 100),
      rarity: 'rare',
      target: 25,
    },
    {
      category: 'activity-specific',
      description: 'Complete 50 contrast time sessions',
      earned: counts.contrastTime >= 50,
      icon: '🎨',
      id: '50-contrast-time',
      name: 'Contrast Time Pro',
      progress: Math.min(100, (counts.contrastTime / 50) * 100),
      rarity: 'epic',
      target: 50,
    },
  ];
}

/**
 * 5. Efficiency & Quality Achievements (Mastery)
 */
function calculateEfficiencyAchievements(
  params: AchievementCalculationParams,
): Array<Achievement> {
  const { activities } = params;
  const nightSleepCount = getNightSleepCount(activities);
  const daySleepCount = getDaySleepCount(activities);
  const quickLogCount = getQuickLogCount(activities);
  const notesCount = getActivitiesWithNotesCount(activities);

  return [
    {
      category: 'efficiency',
      description: 'Track 100 night sleep sessions',
      earned: nightSleepCount >= 100,
      icon: '🌙',
      id: '100-night-sleep',
      name: 'Night Sleep Champion',
      progress: Math.min(100, (nightSleepCount / 100) * 100),
      rarity: 'epic',
      target: 100,
    },
    {
      category: 'efficiency',
      description: 'Track 100 day naps',
      earned: daySleepCount >= 100,
      icon: '😴',
      id: '100-day-sleep',
      name: 'Nap Master',
      progress: Math.min(100, (daySleepCount / 100) * 100),
      rarity: 'epic',
      target: 100,
    },
    {
      category: 'efficiency',
      description: 'Log 50 activities quickly (within 5 minutes)',
      earned: quickLogCount >= 50,
      icon: '⚡',
      id: '50-quick-logs',
      name: 'Quick Logger',
      progress: Math.min(100, (quickLogCount / 50) * 100),
      rarity: 'rare',
      target: 50,
    },
    {
      category: 'efficiency',
      description: 'Add notes to 25 activities',
      earned: notesCount >= 25,
      icon: '📝',
      id: '25-detailed-logs',
      name: 'Detailed Tracker',
      progress: Math.min(100, (notesCount / 25) * 100),
      rarity: 'rare',
      target: 25,
    },
    {
      category: 'efficiency',
      description: 'Add notes to 100 activities',
      earned: notesCount >= 100,
      icon: '📝',
      id: '100-detailed-logs',
      name: 'Journal Keeper',
      progress: Math.min(100, (notesCount / 100) * 100),
      rarity: 'epic',
      target: 100,
    },
  ];
}

/**
 * 6. Record Achievements (Surprise & Delight)
 */
function calculateRecordAchievements(
  params: AchievementCalculationParams,
): Array<Achievement> {
  const { activities } = params;
  const longestSleep = getLongestSleep(activities);
  const mostFeedings = getMostFeedingsInDay(activities);
  const mostActive = getMostActiveDay(activities);
  const totalSleepHours = getTotalSleepHours(activities);

  return [
    {
      category: 'records',
      description: 'Have a sleep session of 6+ hours',
      earned: longestSleep ? longestSleep.duration >= 360 : false,
      icon: '🏃',
      id: 'marathon-sleeper',
      name: 'Marathon Sleeper',
      progress: longestSleep
        ? Math.min(100, (longestSleep.duration / 360) * 100)
        : 0,
      rarity: 'epic',
      target: 360,
    },
    {
      category: 'records',
      description: 'Feed 10+ times in a single day',
      earned: mostFeedings ? mostFeedings.count >= 10 : false,
      icon: '🍼',
      id: 'feeding-frenzy',
      name: 'Feeding Frenzy',
      progress: mostFeedings
        ? Math.min(100, (mostFeedings.count / 10) * 100)
        : 0,
      rarity: 'epic',
      target: 10,
    },
    {
      category: 'records',
      description: 'Log 20+ activities in a single day',
      earned: mostActive ? mostActive.count >= 20 : false,
      icon: '📊',
      id: 'most-active-day',
      name: 'Most Active Day',
      progress: mostActive ? Math.min(100, (mostActive.count / 20) * 100) : 0,
      rarity: 'legendary',
      target: 20,
    },
    {
      category: 'records',
      description: 'Reach 1,000 total sleep hours',
      earned: totalSleepHours >= 1000,
      icon: '💤',
      id: '1000-sleep-hours',
      name: '1,000 Sleep Hours',
      progress: Math.min(100, (totalSleepHours / 1000) * 100),
      rarity: 'legendary',
      target: 1000,
    },
  ];
}

/**
 * 7. Time-Based Achievements (Retention)
 */
function calculateTimeBasedAchievements(
  params: AchievementCalculationParams,
  daysTracking: number,
): Array<Achievement> {
  const consecutiveDays = getConsecutiveTrackingDays(params.activities);

  const achievements: Array<Achievement> = [
    {
      category: 'time-based',
      description: 'Track for 7 consecutive days',
      earned: consecutiveDays >= 7,
      icon: '📆',
      id: '7-consecutive-days',
      name: 'Daily Check-in (7 days)',
      progress: Math.min(100, (consecutiveDays / 7) * 100),
      rarity: 'rare',
      target: 7,
    },
    {
      category: 'time-based',
      description: 'Track for 14 consecutive days',
      earned: consecutiveDays >= 14,
      icon: '📆',
      id: '14-consecutive-days',
      name: 'Daily Check-in (14 days)',
      progress: Math.min(100, (consecutiveDays / 14) * 100),
      rarity: 'epic',
      target: 14,
    },
    {
      category: 'time-based',
      description: 'Track for 30 consecutive days',
      earned: consecutiveDays >= 30,
      icon: '📆',
      id: '30-consecutive-days',
      name: 'Daily Check-in (30 days)',
      progress: Math.min(100, (consecutiveDays / 30) * 100),
      rarity: 'legendary',
      target: 30,
    },
  ];

  // Add milestone tracking days
  if (daysTracking >= 30) {
    achievements.push({
      category: 'time-based',
      description: 'Track for 30 days total',
      earned: true,
      icon: '📅',
      id: '30-days-tracking',
      name: '30 Days',
      progress: 100,
      rarity: 'rare',
      target: 30,
    });
  }

  if (daysTracking >= 100) {
    achievements.push({
      category: 'time-based',
      description: 'Track for 100 days total',
      earned: true,
      icon: '💯',
      id: '100-days-tracking',
      name: '100 Days',
      progress: 100,
      rarity: 'epic',
      target: 100,
    });
  }

  if (daysTracking >= 180) {
    achievements.push({
      category: 'time-based',
      description: 'Track for 6 months',
      earned: true,
      icon: '🎉',
      id: '6-months-tracking',
      name: '6 Months',
      progress: 100,
      rarity: 'legendary',
      target: 180,
    });
  }

  if (daysTracking >= 365) {
    achievements.push({
      category: 'time-based',
      description: 'Track for 1 year',
      earned: true,
      icon: '🎂',
      id: '1-year-tracking',
      name: '1 Year Anniversary',
      progress: 100,
      rarity: 'legendary',
      target: 365,
    });
  }

  return achievements;
}

/**
 * 8. Special & Hidden Achievements (Surprise)
 */
function calculateSpecialAchievements(
  params: AchievementCalculationParams,
): Array<Achievement> {
  const { activities } = params;
  const hasNightOwl = getNightOwlActivities(activities);
  const hasEarlyBird = getEarlyBirdActivities(activities);
  const weekendCount = getWeekendActivityCount(activities);
  const multiTaskHours = getMultiTaskerHours(activities);

  return [
    {
      category: 'special',
      description: 'Log activities after midnight',
      earned: hasNightOwl,
      icon: '🦉',
      id: 'night-owl',
      name: 'Night Owl',
      progress: hasNightOwl ? 100 : 0,
      rarity: 'rare',
      target: 1,
    },
    {
      category: 'special',
      description: 'Log activities before 6am',
      earned: hasEarlyBird,
      icon: '🐦',
      id: 'early-bird',
      name: 'Early Bird',
      progress: hasEarlyBird ? 100 : 0,
      rarity: 'rare',
      target: 1,
    },
    {
      category: 'special',
      description: 'Log 50 activities on weekends',
      earned: weekendCount >= 50,
      icon: '🎉',
      id: 'weekend-warrior',
      name: 'Weekend Warrior',
      progress: Math.min(100, (weekendCount / 50) * 100),
      rarity: 'epic',
      target: 50,
    },
    {
      category: 'special',
      description: 'Log 3+ activity types in the same hour 10 times',
      earned: multiTaskHours >= 10,
      icon: '⚡',
      id: 'multi-tasker',
      name: 'Multi-Tasker',
      progress: Math.min(100, (multiTaskHours / 10) * 100),
      rarity: 'epic',
      target: 10,
    },
  ];
}

/**
 * 9. Personal Milestone Achievements (Age-Based)
 */
function calculatePersonalMilestoneAchievements(
  params: AchievementCalculationParams,
  daysTracking: number,
): Array<Achievement> {
  const { babyBirthDate } = params;
  if (!babyBirthDate) return [];

  const babyAgeDays = differenceInDays(new Date(), babyBirthDate);
  const achievements: Array<Achievement> = [];

  // Week milestones
  if (babyAgeDays >= 7 && daysTracking >= 7) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Survived week 1',
      earned: true,
      icon: '🎊',
      id: 'week-1-survivor',
      name: 'Week 1 Survivor',
      progress: 100,
      rarity: 'common',
      target: 7,
    });
  }

  if (babyAgeDays >= 14 && daysTracking >= 14) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Survived week 2',
      earned: true,
      icon: '🎊',
      id: 'week-2-survivor',
      name: 'Week 2 Survivor',
      progress: 100,
      rarity: 'common',
      target: 14,
    });
  }

  if (babyAgeDays >= 28 && daysTracking >= 28) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Survived week 4',
      earned: true,
      icon: '🎊',
      id: 'week-4-survivor',
      name: 'Week 4 Survivor',
      progress: 100,
      rarity: 'rare',
      target: 28,
    });
  }

  // Month milestones
  if (babyAgeDays >= 30 && daysTracking >= 30) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Completed month 1',
      earned: true,
      icon: '🎂',
      id: 'month-1-champion',
      name: 'Month 1 Champion',
      progress: 100,
      rarity: 'rare',
      target: 30,
    });
  }

  if (babyAgeDays >= 60 && daysTracking >= 60) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Completed month 2',
      earned: true,
      icon: '🎂',
      id: 'month-2-champion',
      name: 'Month 2 Champion',
      progress: 100,
      rarity: 'rare',
      target: 60,
    });
  }

  if (babyAgeDays >= 90 && daysTracking >= 90) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Completed month 3',
      earned: true,
      icon: '🎂',
      id: 'month-3-champion',
      name: 'Month 3 Champion',
      progress: 100,
      rarity: 'epic',
      target: 90,
    });
  }

  if (babyAgeDays >= 100 && daysTracking >= 100) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Reached 100 days',
      earned: true,
      icon: '💯',
      id: '100-days-milestone',
      name: '100 Days Milestone',
      progress: 100,
      rarity: 'epic',
      target: 100,
    });
  }

  if (babyAgeDays >= 180 && daysTracking >= 180) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Completed 6 months',
      earned: true,
      icon: '🎉',
      id: '6-months-milestone',
      name: '6 Months Milestone',
      progress: 100,
      rarity: 'legendary',
      target: 180,
    });
  }

  if (babyAgeDays >= 365 && daysTracking >= 365) {
    achievements.push({
      category: 'personal-milestones',
      description: 'Completed 1 year',
      earned: true,
      icon: '🎂',
      id: '1-year-milestone',
      name: '1 Year Milestone',
      progress: 100,
      rarity: 'legendary',
      target: 365,
    });
  }

  return achievements;
}

/**
 * 10. Parent Milestone Achievements (Survival & Resilience)
 * Celebrating parents for getting through the tough moments
 */
function calculateParentMilestoneAchievements(
  params: AchievementCalculationParams,
  _daysTracking: number,
): Array<Achievement> {
  const { activities } = params;
  const daysSurvived = getDaysSurvived(activities);
  const nightsWithLateActivities = getNightsWithLateActivities(activities);
  const sleepDeprivationCount = getSleepDeprivationActivityCount(activities);
  const nightsWithWakeups = getNightsWithMultipleWakeups(activities);
  const firsts = getParentFirsts(activities, daysSurvived);

  const achievements: Array<Achievement> = [
    // Survival Achievements
    {
      category: 'parent-milestones',
      description: 'You made it through the first day!',
      earned: daysSurvived >= 1,
      icon: '💪',
      id: 'survived-first-day',
      name: 'Survived First Day',
      progress: Math.min(100, (daysSurvived / 1) * 100),
      rarity: 'common',
      target: 1,
    },
    {
      category: 'parent-milestones',
      description: 'You made it through the first week!',
      earned: daysSurvived >= 7,
      icon: '🎉',
      id: 'survived-first-week',
      name: 'Survived First Week',
      progress: Math.min(100, (daysSurvived / 7) * 100),
      rarity: 'rare',
      target: 7,
    },
    {
      category: 'parent-milestones',
      description: 'You survived your first month!',
      earned: daysSurvived >= 30,
      icon: '🏆',
      id: 'survived-first-month',
      name: 'Survived First Month',
      progress: Math.min(100, (daysSurvived / 30) * 100),
      rarity: 'epic',
      target: 30,
    },
    {
      category: 'parent-milestones',
      description: '100 days of parenting!',
      earned: daysSurvived >= 100,
      icon: '💯',
      id: 'survived-100-days',
      name: '100 Days Strong',
      progress: Math.min(100, (daysSurvived / 100) * 100),
      rarity: 'legendary',
      target: 100,
    },
    // Sleep Deprivation Achievements
    {
      category: 'parent-milestones',
      description: 'Logged activities during 10 late nights',
      earned: nightsWithLateActivities >= 10,
      icon: '🌙',
      id: '10-late-nights',
      name: 'Night Warrior',
      progress: Math.min(100, (nightsWithLateActivities / 10) * 100),
      rarity: 'rare',
      target: 10,
    },
    {
      category: 'parent-milestones',
      description: 'Logged activities during 30 late nights',
      earned: nightsWithLateActivities >= 30,
      icon: '🌙',
      id: '30-late-nights',
      name: 'Night Champion',
      progress: Math.min(100, (nightsWithLateActivities / 30) * 100),
      rarity: 'epic',
      target: 30,
    },
    {
      category: 'parent-milestones',
      description: 'Logged 50 activities during sleep-deprived hours',
      earned: sleepDeprivationCount >= 50,
      icon: '😴',
      id: '50-sleep-deprived-activities',
      name: 'Sleep-Deprived Warrior',
      progress: Math.min(100, (sleepDeprivationCount / 50) * 100),
      rarity: 'epic',
      target: 50,
    },
    {
      category: 'parent-milestones',
      description: 'Had 10 nights with multiple wake-ups',
      earned: nightsWithWakeups >= 10,
      icon: '⏰',
      id: '10-nights-wakeups',
      name: 'Wake-Up Warrior',
      progress: Math.min(100, (nightsWithWakeups / 10) * 100),
      rarity: 'rare',
      target: 10,
    },
    {
      category: 'parent-milestones',
      description: 'Had 30 nights with multiple wake-ups',
      earned: nightsWithWakeups >= 30,
      icon: '⏰',
      id: '30-nights-wakeups',
      name: 'Wake-Up Champion',
      progress: Math.min(100, (nightsWithWakeups / 30) * 100),
      rarity: 'epic',
      target: 30,
    },
    // First-Time Parent Experiences
    {
      category: 'parent-milestones',
      description: 'You did your first diaper change!',
      earned: firsts.firstDiaperChange,
      icon: '👶',
      id: 'first-diaper-change-parent',
      name: 'First Diaper Change',
      progress: firsts.firstDiaperChange ? 100 : 0,
      rarity: 'common',
      target: 1,
    },
    {
      category: 'parent-milestones',
      description: 'You fed your baby for the first time!',
      earned: firsts.firstFeeding,
      icon: '🍼',
      id: 'first-feeding-parent',
      name: 'First Feeding',
      progress: firsts.firstFeeding ? 100 : 0,
      rarity: 'common',
      target: 1,
    },
    {
      category: 'parent-milestones',
      description: 'Your first night wake-up - you got this!',
      earned: firsts.firstNightWakeup,
      icon: '🌃',
      id: 'first-night-wakeup',
      name: 'First Night Wake-Up',
      progress: firsts.firstNightWakeup ? 100 : 0,
      rarity: 'common',
      target: 1,
    },
    {
      category: 'parent-milestones',
      description: 'You survived your first week!',
      earned: firsts.firstWeekSurvived,
      icon: '🎊',
      id: 'first-week-survived-parent',
      name: 'First Week Complete',
      progress: firsts.firstWeekSurvived ? 100 : 0,
      rarity: 'rare',
      target: 1,
    },
    {
      category: 'parent-milestones',
      description: 'You made it through your first month!',
      earned: firsts.firstMonthSurvived,
      icon: '🎉',
      id: 'first-month-survived-parent',
      name: 'First Month Complete',
      progress: firsts.firstMonthSurvived ? 100 : 0,
      rarity: 'epic',
      target: 1,
    },
    // Consistency During Tough Times
    {
      category: 'parent-milestones',
      description: 'Tracked consistently for 7 days despite the challenges',
      earned: daysSurvived >= 7 && activities.length >= 7,
      icon: '💪',
      id: 'consistent-first-week',
      name: 'Consistent First Week',
      progress: Math.min(100, (daysSurvived / 7) * 100),
      rarity: 'rare',
      target: 7,
    },
    {
      category: 'parent-milestones',
      description: 'Tracked consistently for 30 days - you are amazing!',
      earned: daysSurvived >= 30 && activities.length >= 30,
      icon: '🌟',
      id: 'consistent-first-month',
      name: 'Consistent First Month',
      progress: Math.min(100, (daysSurvived / 30) * 100),
      rarity: 'epic',
      target: 30,
    },
    // Resilience Achievements
    {
      category: 'parent-milestones',
      description: 'Logged 100 activities - you are doing great!',
      earned: activities.length >= 100,
      icon: '🎯',
      id: '100-activities-parent',
      name: '100 Activities Logged',
      progress: Math.min(100, (activities.length / 100) * 100),
      rarity: 'rare',
      target: 100,
    },
    {
      category: 'parent-milestones',
      description: 'Logged activities even during the toughest nights',
      earned: sleepDeprivationCount >= 25,
      icon: '🌙',
      id: 'persistent-tracker',
      name: 'Persistent Tracker',
      progress: Math.min(100, (sleepDeprivationCount / 25) * 100),
      rarity: 'rare',
      target: 25,
    },
  ];

  return achievements;
}
