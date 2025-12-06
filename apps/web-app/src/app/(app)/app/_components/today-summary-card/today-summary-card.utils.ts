import type { LastActivityUser } from './today-summary-card.types';

/**
 * Format elapsed time in minutes to a human-readable string
 */
export function formatElapsedTime(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

/**
 * Get age-based nursing duration fallback in minutes
 */
export function getAgeBasedNursingDuration(ageDays: number | null): number {
  if (ageDays === null) return 20;
  if (ageDays <= 7) return 30;
  if (ageDays <= 30) return 25;
  if (ageDays <= 90) return 20;
  if (ageDays <= 180) return 15;
  return 15;
}

interface UserData {
  avatarUrl?: string | null;
  firstName?: string | null;
  lastName?: string | null;
  email: string;
}

/**
 * Format user data for last activity display
 */
export function formatLastActivityUser(
  user: UserData | null | undefined,
): LastActivityUser | null {
  if (!user) return null;

  return {
    avatar: user.avatarUrl ?? null,
    initials: (user.firstName?.[0] || user.email[0] || '?').toUpperCase(),
    name:
      [user.firstName, user.lastName].filter(Boolean).join(' ') || user.email,
  };
}
