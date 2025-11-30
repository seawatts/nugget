import type { Activities } from '@nugget/db/schema';
import { startOfDay } from 'date-fns';
import type { Achievement } from '../types';
import {
  getActivityCountToday,
  getEarlyBirdActivities,
  getFirstActivityOfToday,
  getNightOwlActivities,
  hasCoreActivitiesToday,
} from './daily-achievement-helpers';

/**
 * Calculate all daily achievements based on today's activities
 * Daily achievements reset each day and can be earned again
 *
 * Returns achievements with:
 * - category: 'daily-achievements'
 * - completedDate: startOfDay(today) when earned, undefined when not earned
 */
export function calculateDailyAchievements(
  activities: Array<typeof Activities.$inferSelect>,
): Array<Achievement & { completedDate?: Date | null }> {
  const activityCount = getActivityCountToday(activities);
  const today = startOfDay(new Date());
  const hasPerfectDay = hasCoreActivitiesToday(activities);
  const firstActivity = getFirstActivityOfToday(activities);
  const earlyBirdActivities = getEarlyBirdActivities(activities);
  const nightOwlActivities = getNightOwlActivities(activities);

  const achievements: Array<Achievement & { completedDate?: Date | null }> = [
    // Checklist achievements (can be earned every day)
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: activityCount >= 1 ? today : null,
      description: 'Log at least one activity today',
      earned: activityCount >= 1,
      icon: '✅',
      id: 'logged-activity-today',
      name: 'Daily Log',
      progress: activityCount >= 1 ? 100 : 0,
      rarity: 'common',
      target: 1,
      unlockedAt: activityCount >= 1 ? today : null,
    },
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: activityCount >= 3 ? today : null,
      description: 'Log 3 or more activities today',
      earned: activityCount >= 3,
      icon: '📝',
      id: 'logged-3-activities-today',
      name: 'Active Day',
      progress: Math.min(100, (activityCount / 3) * 100),
      rarity: 'common',
      target: 3,
      unlockedAt: activityCount >= 3 ? today : null,
    },
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: activityCount >= 5 ? today : null,
      description: 'Log 5 or more activities today',
      earned: activityCount >= 5,
      icon: '🔥',
      id: 'logged-5-activities-today',
      name: 'Super Active',
      progress: Math.min(100, (activityCount / 5) * 100),
      rarity: 'rare',
      target: 5,
      unlockedAt: activityCount >= 5 ? today : null,
    },
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: activityCount >= 10 ? today : null,
      description: 'Log 10 or more activities today',
      earned: activityCount >= 10,
      icon: '⚡',
      id: 'logged-10-activities-today',
      name: 'Power User',
      progress: Math.min(100, (activityCount / 10) * 100),
      rarity: 'epic',
      target: 10,
      unlockedAt: activityCount >= 10 ? today : null,
    },
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: hasPerfectDay ? today : null,
      description: 'Logged all core activities (feeding, sleep, diaper) today',
      earned: hasPerfectDay,
      icon: '✨',
      id: 'perfect-day',
      name: 'Perfect Day',
      progress: hasPerfectDay ? 100 : 0,
      rarity: 'epic',
      target: 1,
      unlockedAt: hasPerfectDay ? today : null,
    },

    // One-time daily achievements (can only be earned once per day)
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: firstActivity ? today : null,
      description: 'Logged your first activity of the day',
      earned: firstActivity !== null,
      icon: '🌅',
      id: 'first-activity-today',
      name: 'First Activity',
      progress: firstActivity !== null ? 100 : 0,
      rarity: 'common',
      target: 1,
      unlockedAt: firstActivity ? today : null,
    },
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: earlyBirdActivities.length > 0 ? today : null,
      description: 'Logged an activity before 7am',
      earned: earlyBirdActivities.length > 0,
      icon: '🐦',
      id: 'early-bird',
      name: 'Early Bird',
      progress: earlyBirdActivities.length > 0 ? 100 : 0,
      rarity: 'rare',
      target: 1,
      unlockedAt: earlyBirdActivities.length > 0 ? today : null,
    },
    {
      category: 'daily-achievements' as Achievement['category'],
      completedDate: nightOwlActivities.length > 0 ? today : null,
      description: 'Logged an activity after 10pm',
      earned: nightOwlActivities.length > 0,
      icon: '🦉',
      id: 'night-owl',
      name: 'Night Owl',
      progress: nightOwlActivities.length > 0 ? 100 : 0,
      rarity: 'rare',
      target: 1,
      unlockedAt: nightOwlActivities.length > 0 ? today : null,
    },
  ];

  return achievements;
}
