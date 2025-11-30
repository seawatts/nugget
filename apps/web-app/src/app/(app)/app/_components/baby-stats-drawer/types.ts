import type { Activities } from '@nugget/db/schema';

export interface BabyStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  activities?: Array<typeof Activities.$inferSelect>;
  measurementUnit?: 'metric' | 'imperial';
}

export interface Streaks {
  feeding: { current: number; longest: number };
  diaper: { current: number; longest: number };
  sleep: { current: number; longest: number };
  perfectDay: { current: number; longest: number };
}

export interface Achievement {
  earned: boolean;
  icon: string;
  id: string;
  name: string;
  progress: number;
  target: number;
}

export interface WeeklyHighlights {
  bestDay: { count: number; date: Date } | null;
  feedingTrend: number | null;
  improvementMessage: string | null;
  newRecords: Array<string>;
}

export interface Milestone {
  reached: number;
  next: number;
  progress: number;
}

export interface Milestones {
  activityMilestone: Milestone | null;
  volumeMilestone: Milestone | null;
  diaperMilestone: Milestone | null;
  daysMilestone: Milestone | null;
}

export interface Records {
  longestSleep: { duration: number; date: Date } | null;
  mostFeedingsInDay: { count: number; date: Date } | null;
  mostActiveDay: { count: number; date: Date } | null;
  fastestFeeding: { minutes: number; date: Date } | null;
  longestGap: { hours: number; date: Date } | null;
}

export interface Patterns {
  nightOwl: boolean;
  mostProductiveHour: number;
  weekendWarrior: { weekday: number; weekend: number };
  feedingStyle: 'bottle' | 'nursing' | 'balanced';
  trackingAccuracy: number;
}

export interface RealWorldComparisons {
  activities: string;
  contrastTime: string;
  diaper: string;
  milk: string;
  nailTrimming: string;
  sleep: string;
  vitaminD: string;
  walks: string;
}

export interface HumorousStats {
  avgDiaperGap: number;
  maxInHour: number;
  sleepEfficiency: number;
}

export interface FunStats {
  totalActivities: number;
  daysSinceFirst: number;
  mostActiveDay: string | null;
  mostActiveDayCount: number;
  avgPerDay7d: number;
  avgPerDay30d: number;
  totalVolumeMl: number;
  totalDiapers: number;
}
