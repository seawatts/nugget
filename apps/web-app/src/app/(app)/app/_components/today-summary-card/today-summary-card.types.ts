import type { Activities } from '@nugget/db/schema';

export interface TodaySummaryCardProps {
  babyBirthDate?: Date | null;
  babyName?: string;
  babyPhotoUrl?: string | null;
  babyAvatarBackgroundColor?: string | null;
  measurementUnit?: 'metric' | 'imperial';
}

export type AgeUnit = 'days' | 'weeks' | 'months' | 'years' | 'detailed';

export type QuickActionType =
  | 'bottle'
  | 'nursing'
  | 'wet'
  | 'dirty'
  | 'sleep-timer'
  | null;

export interface PendingActivity {
  type: 'bottle' | 'nursing' | 'wet' | 'dirty';
  data?: {
    amountMl?: number;
    duration?: number;
    feedingSource?: 'formula' | 'pumped' | 'direct';
    side?: 'left' | 'right' | 'both';
  };
}

export interface LastActivityUser {
  avatar: string | null;
  initials: string;
  name: string;
}

export interface LastActivityInfo {
  time: string | null;
  exactTime: string | null;
  user: LastActivityUser | null;
  activity: typeof Activities.$inferSelect | null;
}

export interface UpcomingCelebration {
  babyLabel: string;
  daysUntil: number;
  title: string;
}

export type ActivityType = 'bottle' | 'nursing' | 'wet' | 'dirty';
