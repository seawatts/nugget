import type { Streaks } from '../types';

/**
 * Generate encouragement message
 */
export function generateEncouragementMessage(
  streaks: Pick<Streaks, 'feeding' | 'perfectDay'>,
  totalActivities: number,
  daysTracking: number,
): string | null {
  if (streaks.perfectDay.current >= 7) {
    return "You're on fire! 🔥 7+ perfect days in a row!";
  }
  if (streaks.feeding.current >= 7) {
    return 'Amazing consistency! Keep up the great work! 💪';
  }
  if (daysTracking >= 30 && totalActivities >= 100) {
    return "You've been tracking for a month! That's dedication! 🌟";
  }
  if (streaks.perfectDay.current >= 3) {
    return "Great tracking this week! You're doing amazing! ⭐";
  }
  if (totalActivities >= 500) {
    return "Over 500 activities logged! You're a pro! 🏆";
  }
  if (daysTracking >= 7) {
    return 'A week of tracking! Every moment counts! 📊';
  }
  return null;
}
