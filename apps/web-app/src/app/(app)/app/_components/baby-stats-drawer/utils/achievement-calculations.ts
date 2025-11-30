import type { Achievement, Streaks } from '../types';

/**
 * Calculate achievement badges
 */
export function calculateAchievements(
  totalActivities: number,
  totalVolumeMl: number,
  totalDiapers: number,
  daysTracking: number,
  streaks: Streaks,
): Array<Achievement> {
  const achievements = [
    {
      earned: totalActivities >= 100,
      icon: '🎯',
      id: '100-activities',
      name: '100 Activities',
      progress: Math.min(100, (totalActivities / 100) * 100),
      target: 100,
    },
    {
      earned: totalActivities >= 500,
      icon: '🏆',
      id: '500-activities',
      name: '500 Activities',
      progress: Math.min(100, (totalActivities / 500) * 100),
      target: 500,
    },
    {
      earned: totalActivities >= 1000,
      icon: '⭐',
      id: '1000-activities',
      name: '1000 Activities',
      progress: Math.min(100, (totalActivities / 1000) * 100),
      target: 1000,
    },
    {
      earned: totalVolumeMl >= 10000,
      icon: '🥛',
      id: '10l-milk',
      name: '10L Fed',
      progress: Math.min(100, (totalVolumeMl / 10000) * 100),
      target: 10000,
    },
    {
      earned: totalDiapers >= 500,
      icon: '👶',
      id: '500-diapers',
      name: '500 Diapers',
      progress: Math.min(100, (totalDiapers / 500) * 100),
      target: 500,
    },
    {
      earned: daysTracking >= 30,
      icon: '📅',
      id: '30-days',
      name: '30 Days',
      progress: Math.min(100, (daysTracking / 30) * 100),
      target: 30,
    },
    {
      earned: daysTracking >= 100,
      icon: '💯',
      id: '100-days',
      name: '100 Days',
      progress: Math.min(100, (daysTracking / 100) * 100),
      target: 100,
    },
    {
      earned: streaks.feeding.current >= 7,
      icon: '🔥',
      id: '7-day-feeding',
      name: '7-Day Feeding Streak',
      progress: Math.min(100, (streaks.feeding.current / 7) * 100),
      target: 7,
    },
    {
      earned: streaks.perfectDay.current >= 3,
      icon: '✨',
      id: '3-perfect-days',
      name: '3 Perfect Days',
      progress: Math.min(100, (streaks.perfectDay.current / 3) * 100),
      target: 3,
    },
  ];

  return achievements;
}
