'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Button } from '@nugget/ui/button';
import { Card } from '@nugget/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@nugget/ui/dropdown-menu';
import {
  format,
  getDay,
  startOfDay,
  startOfWeek,
  subDays,
  subHours,
  subMonths,
  subWeeks,
} from 'date-fns';
import { ChevronDown } from 'lucide-react';
import { useMemo, useState } from 'react';
import { calculateTodaysFeedingStats } from './activities/feeding/feeding-goals';
import { calculateBabyAgeDays } from './activities/shared/baby-age-utils';
import { GenericTrendChart } from './activities/shared/components/generic-trend-chart';
import {
  FrequencyHeatmap,
  StatsDrawerWrapper,
  TimeBlockChart,
} from './activities/shared/components/stats';
import type { TrendData } from './activities/shared/types';
import {
  calculateHourlyFrequency,
  calculateTimeBlockData,
} from './activities/shared/utils/frequency-utils';

interface BabyStatsDrawerProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  babyId: string;
  activities: Array<typeof Activities.$inferSelect>;
  measurementUnit?: 'metric' | 'imperial';
}

/**
 * Calculate estimated weight based on age and birth weight
 * Formula from feed-calculator/page.tsx:
 * - Days 1-14: Should regain birth weight
 * - After day 14: Birth weight + (days after regain × 0.75 oz/day)
 */
function calculateEstimatedWeight(
  ageDays: number | null,
  birthWeightOz: number | null,
): number | null {
  if (!ageDays || !birthWeightOz) return null;

  // Days 1-14: Should regain birth weight
  if (ageDays <= 14) {
    return birthWeightOz;
  }

  // After regaining birth weight, babies typically gain 0.5-1 oz per day (avg 0.75 oz/day)
  const daysAfterRegain = ageDays - 14;
  const expectedGainOz = daysAfterRegain * 0.75;
  return birthWeightOz + expectedGainOz;
}

/**
 * Convert ounces to pounds and ounces
 */
function formatWeightOz(totalOz: number): { lbs: number; oz: number } {
  const lbs = Math.floor(totalOz / 16);
  const oz = totalOz % 16;
  return { lbs, oz };
}

/**
 * Convert ounces to kilograms and grams
 */
function formatWeightKg(totalOz: number): { kg: number; g: number } {
  const totalGrams = totalOz * 28.3495; // 1 oz = 28.3495 g
  const kg = Math.floor(totalGrams / 1000);
  const g = Math.round(totalGrams % 1000);
  return { g, kg };
}

/**
 * Format weight for display
 */
function formatWeightDisplay(
  totalOz: number,
  unit: 'metric' | 'imperial',
): string {
  if (unit === 'imperial') {
    const { lbs, oz } = formatWeightOz(totalOz);
    if (lbs === 0) {
      return `${oz} oz`;
    }
    if (oz === 0) {
      return `${lbs} lb${lbs !== 1 ? 's' : ''}`;
    }
    return `${lbs} lb ${oz} oz`;
  }
  const { kg, g } = formatWeightKg(totalOz);
  if (kg === 0) {
    return `${g} g`;
  }
  if (g === 0) {
    return `${kg} kg`;
  }
  return `${kg}.${Math.floor(g / 100)} kg`;
}

/**
 * Format age in a readable format
 */
function formatAge(ageDays: number): string {
  if (ageDays < 7) {
    return `${ageDays} ${ageDays === 1 ? 'day' : 'days'}`;
  }
  if (ageDays < 30) {
    const weeks = Math.floor(ageDays / 7);
    const days = ageDays % 7;
    if (days === 0) {
      return `${weeks} ${weeks === 1 ? 'week' : 'weeks'}`;
    }
    return `${weeks}w ${days}d`;
  }
  if (ageDays < 365) {
    const months = Math.floor(ageDays / 30.44);
    const days = Math.floor(ageDays % 30.44);
    if (days === 0) {
      return `${months} ${months === 1 ? 'month' : 'months'}`;
    }
    return `${months}m ${days}d`;
  }
  const years = Math.floor(ageDays / 365.25);
  const months = Math.floor((ageDays % 365.25) / 30.44);
  if (months === 0) {
    return `${years} ${years === 1 ? 'year' : 'years'}`;
  }
  return `${years}y ${months}m`;
}

/**
 * Calculate all activities trend data (aggregated across all types)
 */
function calculateAllActivitiesTrendData(
  activities: Array<typeof Activities.$inferSelect>,
  timeRange: '24h' | '7d' | '2w' | '1m' | '3m' | '6m' = '7d',
): TrendData[] {
  const now = new Date();
  let startDate: Date;
  let points: number;
  let groupBy: 'hour' | 'day' | 'week';

  switch (timeRange) {
    case '24h':
      startDate = subHours(now, 24);
      points = 24;
      groupBy = 'hour';
      break;
    case '7d':
      startDate = startOfDay(subDays(now, 6));
      points = 7;
      groupBy = 'day';
      break;
    case '2w':
      startDate = startOfDay(subWeeks(now, 2));
      points = 14;
      groupBy = 'day';
      break;
    case '1m':
      startDate = startOfDay(subMonths(now, 1));
      points = 30;
      groupBy = 'day';
      break;
    case '3m':
      startDate = startOfDay(subMonths(now, 3));
      points = 12;
      groupBy = 'week';
      break;
    case '6m':
      startDate = startOfDay(subMonths(now, 6));
      points = 26;
      groupBy = 'week';
      break;
    default:
      startDate = startOfDay(subDays(now, 6));
      points = 7;
      groupBy = 'day';
  }

  // Filter activities to time range
  const relevantActivities = activities.filter(
    (activity) =>
      new Date(activity.startTime) >= startDate &&
      new Date(activity.startTime) <= now,
  );

  // Group by time period
  const trendData: TrendData[] = [];

  if (groupBy === 'hour') {
    for (let i = 0; i < points; i++) {
      const periodStart = subHours(now, points - i);
      const periodEnd = subHours(now, points - i - 1);

      const count = relevantActivities.filter((activity) => {
        const activityTime = new Date(activity.startTime);
        return activityTime >= periodEnd && activityTime < periodStart;
      }).length;

      trendData.push({
        count,
        date: format(periodStart, 'yyyy-MM-dd HH:mm'),
        displayDate: format(periodStart, 'ha'),
      });
    }
  } else {
    // Day or week grouping
    for (let i = 0; i < points; i++) {
      const periodStart =
        groupBy === 'day'
          ? startOfDay(subDays(now, points - i - 1))
          : startOfWeek(subWeeks(now, points - i - 1), { weekStartsOn: 1 });
      const periodEnd =
        groupBy === 'day'
          ? startOfDay(subDays(now, points - i - 2))
          : startOfWeek(subWeeks(now, points - i - 2), { weekStartsOn: 1 });

      const count = relevantActivities.filter((activity) => {
        const activityTime = new Date(activity.startTime);
        return activityTime >= periodStart && activityTime < periodEnd;
      }).length;

      trendData.push({
        count,
        date: format(periodStart, 'yyyy-MM-dd'),
        displayDate:
          groupBy === 'day'
            ? format(periodStart, 'MMM d')
            : `Week of ${format(periodStart, 'MMM d')}`,
      });
    }
  }

  return trendData;
}

/**
 * Calculate activity type distribution
 */
function calculateActivityTypeDistribution(
  activities: Array<typeof Activities.$inferSelect>,
  days = 7,
): Array<{ type: string; count: number; label: string }> {
  const cutoff = startOfDay(subDays(new Date(), days));
  const filtered = activities.filter((a) => new Date(a.startTime) >= cutoff);

  const typeMap = new Map<string, number>();
  filtered.forEach((activity) => {
    const type = activity.type;
    typeMap.set(type, (typeMap.get(type) || 0) + 1);
  });

  const typeLabels: Record<string, string> = {
    bath: 'Bath',
    bottle: 'Bottle',
    'contrast-time': 'Contrast Time',
    diaper: 'Diaper',
    dirty: 'Dirty',
    'doctor-visit': 'Doctor Visit',
    feeding: 'Feeding',
    'nail-trimming': 'Nail Trimming',
    nursing: 'Nursing',
    pumping: 'Pumping',
    sleep: 'Sleep',
    solids: 'Solids',
    'vitamin-d': 'Vitamin D',
    walk: 'Walk',
    wet: 'Wet',
  };

  return Array.from(typeMap.entries())
    .map(([type, count]) => ({
      count,
      label: typeLabels[type] || type,
      type,
    }))
    .sort((a, b) => b.count - a.count);
}

/**
 * Calculate streaks for various activity types
 */
function calculateStreaks(activities: Array<typeof Activities.$inferSelect>): {
  feeding: { current: number; longest: number };
  diaper: { current: number; longest: number };
  sleep: { current: number; longest: number };
  perfectDay: { current: number; longest: number };
} {
  const now = new Date();
  const activitiesByDay = new Map<string, Set<string>>();

  // Group activities by day
  activities.forEach((activity) => {
    const day = format(startOfDay(new Date(activity.startTime)), 'yyyy-MM-dd');
    if (!activitiesByDay.has(day)) {
      activitiesByDay.set(day, new Set());
    }
    activitiesByDay.get(day)?.add(activity.type);
  });

  const days = Array.from(activitiesByDay.keys()).sort().reverse();
  if (days.length === 0) {
    return {
      diaper: { current: 0, longest: 0 },
      feeding: { current: 0, longest: 0 },
      perfectDay: { current: 0, longest: 0 },
      sleep: { current: 0, longest: 0 },
    };
  }

  // Helper to calculate streak
  const calculateStreak = (
    checkFn: (dayActivities: Set<string>) => boolean,
    startFromToday = true,
  ): number => {
    let streak = 0;
    const startDay = startFromToday
      ? format(startOfDay(now), 'yyyy-MM-dd')
      : days[0]!;
    const sortedDays = startFromToday
      ? [startDay, ...days.filter((d) => d < startDay)].sort().reverse()
      : days;

    for (const day of sortedDays) {
      const dayActivities = activitiesByDay.get(day);
      if (dayActivities && checkFn(dayActivities)) {
        streak++;
      } else {
        break;
      }
    }
    return streak;
  };

  const hasFeeding = (dayActivities: Set<string>) =>
    dayActivities.has('bottle') ||
    dayActivities.has('nursing') ||
    dayActivities.has('feeding');
  const hasDiaper = (dayActivities: Set<string>) =>
    dayActivities.has('diaper') ||
    dayActivities.has('wet') ||
    dayActivities.has('dirty');
  const hasSleep = (dayActivities: Set<string>) => dayActivities.has('sleep');
  const hasPerfectDay = (dayActivities: Set<string>) =>
    hasFeeding(dayActivities) &&
    hasDiaper(dayActivities) &&
    hasSleep(dayActivities);

  return {
    diaper: {
      current: calculateStreak(hasDiaper, true),
      longest: calculateStreak(hasDiaper, false),
    },
    feeding: {
      current: calculateStreak(hasFeeding, true),
      longest: calculateStreak(hasFeeding, false),
    },
    perfectDay: {
      current: calculateStreak(hasPerfectDay, true),
      longest: calculateStreak(hasPerfectDay, false),
    },
    sleep: {
      current: calculateStreak(hasSleep, true),
      longest: calculateStreak(hasSleep, false),
    },
  };
}

/**
 * Calculate fun real-world comparisons
 */
function calculateRealWorldComparisons(
  totalDiapers: number,
  totalVolumeMl: number,
  totalSleepHours: number,
  totalActivities: number,
  totalVitaminD: number,
  totalWalks: number,
  totalNailTrimming: number,
  totalContrastTime: number,
): {
  activities: string;
  contrastTime: string;
  diaper: string;
  milk: string;
  nailTrimming: string;
  sleep: string;
  vitaminD: string;
  walks: string;
} {
  // Diaper comparisons
  let diaperComparison = '';
  if (totalDiapers >= 1000) {
    const elephants = (totalDiapers * 0.5) / 12000; // ~0.5 lbs per diaper, elephant = 12000 lbs
    diaperComparison = `That's as heavy as ${Math.round(elephants * 10) / 10} elephants! 🐘`;
  } else if (totalDiapers >= 500) {
    const bowlingBalls = Math.round((totalDiapers * 0.5) / 16);
    diaperComparison = `That's like ${bowlingBalls} bowling balls! 🎳`;
  } else if (totalDiapers >= 100) {
    const bathtubs = Math.round(totalDiapers / 50);
    diaperComparison = `Enough to fill ${bathtubs} bathtub${bathtubs !== 1 ? 's' : ''}! 🛁`;
  } else {
    diaperComparison = `Keep it up! You're doing great! 💪`;
  }

  // Milk comparisons
  let milkComparison = '';
  const totalOz = totalVolumeMl / 29.5735;
  const totalGallons = totalOz / 128;
  if (totalGallons >= 100) {
    const pools = Math.round(totalGallons / 20000);
    milkComparison = `Enough to fill ${pools} swimming pool${pools !== 1 ? 's' : ''}! 🏊`;
  } else if (totalGallons >= 10) {
    const bottles = Math.round(totalOz / 4);
    milkComparison = `That's ${bottles.toLocaleString()} baby bottles! 🍼`;
  } else if (totalGallons >= 1) {
    milkComparison = `Over ${Math.round(totalGallons * 10) / 10} gallons! 🥛`;
  } else {
    milkComparison = 'Every drop counts! 💧';
  }

  // Sleep comparisons
  let sleepComparison = '';
  const fullDays = Math.floor(totalSleepHours / 24);
  if (fullDays >= 30) {
    sleepComparison = `That's ${fullDays} full days of sleep! 😴`;
  } else if (fullDays >= 7) {
    sleepComparison = `Over ${fullDays} days of sleep! 🌙`;
  } else {
    sleepComparison = `${Math.round(totalSleepHours)} hours of sweet dreams! 💤`;
  }

  // Activity comparisons
  let activityComparison = '';
  if (totalActivities >= 1000) {
    activityComparison = `You've logged ${totalActivities.toLocaleString()} activities - that's dedication! 🏆`;
  } else if (totalActivities >= 500) {
    activityComparison = 'Halfway to 1000! Keep going! 🎯';
  } else if (totalActivities >= 100) {
    activityComparison = 'Over 100 activities logged! 📊';
  } else {
    activityComparison = 'Building your tracking history! 📈';
  }

  // Vitamin D comparisons
  let vitaminDComparison = '';
  if (totalVitaminD >= 365) {
    vitaminDComparison = `A full year of sunshine! That's ${Math.round(totalVitaminD / 365)} years! ☀️`;
  } else if (totalVitaminD >= 100) {
    vitaminDComparison = `Over 100 doses - that's like ${Math.round(totalVitaminD / 30)} months of daily vitamins! 💊`;
  } else if (totalVitaminD >= 30) {
    vitaminDComparison =
      'A full month of vitamin D! Your baby is getting strong! 💪';
  } else if (totalVitaminD > 0) {
    vitaminDComparison = `${totalVitaminD} doses of sunshine! Keep it up! 🌞`;
  } else {
    vitaminDComparison = 'Start tracking vitamin D for healthy bones! 🦴';
  }

  // Walking comparisons
  let walksComparison = '';
  if (totalWalks >= 1000) {
    const miles = Math.round((totalWalks * 0.5) / 10) / 10; // Assuming ~0.5 miles per walk
    walksComparison = `Over 1000 walks! That's like walking ${miles} miles! 🚶‍♀️`;
  } else if (totalWalks >= 365) {
    walksComparison = `A full year of walks! That's dedication to fresh air! 🌳`;
  } else if (totalWalks >= 100) {
    walksComparison =
      'Over 100 walks! Your baby has seen a lot of the world! 🌍';
  } else if (totalWalks >= 30) {
    walksComparison = 'A month of walks! Building those leg muscles! 🦵';
  } else if (totalWalks > 0) {
    walksComparison = `${totalWalks} walks logged! Every step counts! 👣`;
  } else {
    walksComparison = 'Time for a walk? Fresh air is great! 🌤️';
  }

  // Nail trimming comparisons
  let nailTrimmingComparison = '';
  if (totalNailTrimming >= 100) {
    const years = Math.round((totalNailTrimming / 52) * 10) / 10; // ~weekly = 52 per year
    nailTrimmingComparison = `Over 100 trims! That's ${years} years of keeping those nails neat! ✂️`;
  } else if (totalNailTrimming >= 52) {
    nailTrimmingComparison = 'A full year of nail trims! No scratches here! 🎯';
  } else if (totalNailTrimming >= 12) {
    nailTrimmingComparison = `Over 12 trims! That's like 3 months of perfect nails! 💅`;
  } else if (totalNailTrimming > 0) {
    nailTrimmingComparison = `${totalNailTrimming} nail trims! Keeping those tiny fingers safe! 👶`;
  } else {
    nailTrimmingComparison = `Don't forget those tiny nails! ✂️`;
  }

  // Contrast time comparisons
  let contrastTimeComparison = '';
  if (totalContrastTime >= 365) {
    contrastTimeComparison = `A full year of contrast time! That's amazing visual development! 👁️`;
  } else if (totalContrastTime >= 100) {
    const months = Math.round((totalContrastTime / 30) * 10) / 10;
    contrastTimeComparison = `Over 100 sessions! That's ${months} months of brain-building! 🧠`;
  } else if (totalContrastTime >= 30) {
    contrastTimeComparison =
      'A full month of contrast time! Building those neural pathways! 🎨';
  } else if (totalContrastTime > 0) {
    contrastTimeComparison = `${totalContrastTime} contrast sessions! Great for development! 🌈`;
  } else {
    contrastTimeComparison = 'Try contrast time for visual development! 🎭';
  }

  return {
    activities: activityComparison,
    contrastTime: contrastTimeComparison,
    diaper: diaperComparison,
    milk: milkComparison,
    nailTrimming: nailTrimmingComparison,
    sleep: sleepComparison,
    vitaminD: vitaminDComparison,
    walks: walksComparison,
  };
}

/**
 * Calculate pattern recognition stats
 */
function calculatePatterns(activities: Array<typeof Activities.$inferSelect>): {
  nightOwl: boolean;
  mostProductiveHour: number;
  weekendWarrior: { weekday: number; weekend: number };
  feedingStyle: 'bottle' | 'nursing' | 'balanced';
  trackingAccuracy: number;
} {
  if (activities.length === 0) {
    return {
      feedingStyle: 'balanced',
      mostProductiveHour: 12,
      nightOwl: false,
      trackingAccuracy: 0,
      weekendWarrior: { weekday: 0, weekend: 0 },
    };
  }

  // Night owl vs early bird (most active hours)
  const hourCounts = new Map<number, number>();
  activities.forEach((activity) => {
    const hour = new Date(activity.startTime).getHours();
    hourCounts.set(hour, (hourCounts.get(hour) || 0) + 1);
  });

  let maxCount = 0;
  let mostProductiveHour = 12;
  hourCounts.forEach((count, hour) => {
    if (count > maxCount) {
      maxCount = count;
      mostProductiveHour = hour;
    }
  });

  const nightOwl = mostProductiveHour >= 20 || mostProductiveHour <= 4;

  // Weekend warrior
  let weekdayCount = 0;
  let weekendCount = 0;
  activities.forEach((activity) => {
    const day = getDay(new Date(activity.startTime));
    if (day === 0 || day === 6) {
      weekendCount++;
    } else {
      weekdayCount++;
    }
  });

  // Feeding style
  const bottleCount = activities.filter((a) => a.type === 'bottle').length;
  const nursingCount = activities.filter((a) => a.type === 'nursing').length;
  const feedingStyle =
    bottleCount > nursingCount * 1.5
      ? 'bottle'
      : nursingCount > bottleCount * 1.5
        ? 'nursing'
        : 'balanced';

  // Tracking accuracy (estimate based on activity frequency)
  const daysWithActivities = new Set(
    activities.map((a) =>
      format(startOfDay(new Date(a.startTime)), 'yyyy-MM-dd'),
    ),
  ).size;
  const estimatedDays = Math.min(
    daysWithActivities,
    Math.ceil(
      (Date.now() - new Date(activities[0]?.startTime).getTime()) /
        (1000 * 60 * 60 * 24),
    ),
  );
  const trackingAccuracy =
    estimatedDays > 0
      ? Math.min(100, Math.round((daysWithActivities / estimatedDays) * 100))
      : 0;

  return {
    feedingStyle,
    mostProductiveHour,
    nightOwl,
    trackingAccuracy,
    weekendWarrior: { weekday: weekdayCount, weekend: weekendCount },
  };
}

/**
 * Calculate records and personal bests
 */
function calculateRecords(activities: Array<typeof Activities.$inferSelect>): {
  longestSleep: { duration: number; date: Date } | null;
  mostFeedingsInDay: { count: number; date: Date } | null;
  mostActiveDay: { count: number; date: Date } | null;
  fastestFeeding: { minutes: number; date: Date } | null;
  longestGap: { hours: number; date: Date } | null;
} {
  if (activities.length === 0) {
    return {
      fastestFeeding: null,
      longestGap: null,
      longestSleep: null,
      mostActiveDay: null,
      mostFeedingsInDay: null,
    };
  }

  // Longest sleep
  const sleepActivities = activities
    .filter((a) => a.type === 'sleep' && a.duration)
    .sort((a, b) => (b.duration || 0) - (a.duration || 0));
  const longestSleep = sleepActivities[0]?.duration
    ? {
        date: new Date(sleepActivities[0].startTime),
        duration: sleepActivities[0].duration,
      }
    : null;

  // Most feedings in a day
  const feedingsByDay = new Map<string, number>();
  activities
    .filter(
      (a) =>
        a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding',
    )
    .forEach((activity) => {
      const day = format(
        startOfDay(new Date(activity.startTime)),
        'yyyy-MM-dd',
      );
      feedingsByDay.set(day, (feedingsByDay.get(day) || 0) + 1);
    });

  let maxFeedings = 0;
  let maxFeedingsDay: string | null = null;
  feedingsByDay.forEach((count, day) => {
    if (count > maxFeedings) {
      maxFeedings = count;
      maxFeedingsDay = day;
    }
  });

  // Most active day
  const activitiesByDay = new Map<string, number>();
  activities.forEach((activity) => {
    const day = format(startOfDay(new Date(activity.startTime)), 'yyyy-MM-dd');
    activitiesByDay.set(day, (activitiesByDay.get(day) || 0) + 1);
  });

  let maxActivities = 0;
  let maxActivitiesDay: string | null = null;
  activitiesByDay.forEach((count, day) => {
    if (count > maxActivities) {
      maxActivities = count;
      maxActivitiesDay = day;
    }
  });

  // Fastest feeding (shortest time between feedings)
  const feedingTimes = activities
    .filter(
      (a) =>
        a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding',
    )
    .map((a) => new Date(a.startTime).getTime())
    .sort((a, b) => a - b);

  let minGap = Number.POSITIVE_INFINITY;
  let minGapDate: Date | null = null;
  for (let i = 1; i < feedingTimes.length; i++) {
    const gap = (feedingTimes[i]! - feedingTimes[i - 1]!) / (1000 * 60);
    if (gap < minGap && gap > 0) {
      minGap = gap;
      minGapDate = new Date(feedingTimes[i]!);
    }
  }

  // Longest gap between any activities
  const allTimes = activities
    .map((a) => new Date(a.startTime).getTime())
    .sort((a, b) => a - b);

  let maxGap = 0;
  let maxGapDate: Date | null = null;
  for (let i = 1; i < allTimes.length; i++) {
    const gap = (allTimes[i]! - allTimes[i - 1]!) / (1000 * 60 * 60);
    if (gap > maxGap) {
      maxGap = gap;
      maxGapDate = new Date(allTimes[i]!);
    }
  }

  return {
    fastestFeeding:
      minGapDate && minGap < Number.POSITIVE_INFINITY
        ? { date: minGapDate, minutes: Math.round(minGap) }
        : null,
    longestGap:
      maxGapDate && maxGap > 0
        ? { date: maxGapDate, hours: Math.round(maxGap * 10) / 10 }
        : null,
    longestSleep,
    mostActiveDay:
      maxActivitiesDay && maxActivities > 0
        ? { count: maxActivities, date: new Date(maxActivitiesDay) }
        : null,
    mostFeedingsInDay:
      maxFeedingsDay && maxFeedings > 0
        ? { count: maxFeedings, date: new Date(maxFeedingsDay) }
        : null,
  };
}

/**
 * Calculate milestones
 */
function calculateMilestones(
  totalActivities: number,
  totalVolumeMl: number,
  totalDiapers: number,
  daysTracking: number,
): {
  activityMilestone: { reached: number; next: number; progress: number } | null;
  volumeMilestone: { reached: number; next: number; progress: number } | null;
  diaperMilestone: { reached: number; next: number; progress: number } | null;
  daysMilestone: { reached: number; next: number; progress: number } | null;
} {
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

export function BabyStatsDrawer({
  open,
  onOpenChange,
  babyId,
  activities,
  measurementUnit = 'metric',
}: BabyStatsDrawerProps) {
  const [trendTimeRange, setTrendTimeRange] = useState<
    '24h' | '7d' | '2w' | '1m' | '3m' | '6m'
  >('7d');
  const [activityPeriod, setActivityPeriod] = useState<'week' | 'month'>(
    'week',
  );

  // Fetch baby data
  const { data: baby } = api.babies.getByIdLight.useQuery(
    { id: babyId },
    { enabled: Boolean(babyId) },
  );

  // Calculate age
  const ageDays = useMemo(() => {
    if (!baby?.birthDate) return null;
    return calculateBabyAgeDays(new Date(baby.birthDate));
  }, [baby?.birthDate]);

  // Filter to today's activities
  const todayStart = useMemo(() => startOfDay(new Date()), []);
  const todayActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= todayStart;
    });
  }, [activities, todayStart]);

  // Filter to this week's activities
  const weekStart = useMemo(
    () => startOfWeek(new Date(), { weekStartsOn: 1 }),
    [],
  );
  const weekActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= weekStart;
    });
  }, [activities, weekStart]);

  // Filter to this month's activities
  const monthStart = useMemo(() => startOfDay(subDays(new Date(), 30)), []);
  const monthActivities = useMemo(() => {
    return activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= monthStart;
    });
  }, [activities, monthStart]);

  // Calculate estimated weight
  const estimatedWeightOz = useMemo(() => {
    if (!ageDays || !baby?.birthWeightOz) return null;
    return calculateEstimatedWeight(ageDays, baby.birthWeightOz);
  }, [ageDays, baby?.birthWeightOz]);

  // Calculate feeding stats
  const feedingStats = useMemo(() => {
    return calculateTodaysFeedingStats(todayActivities);
  }, [todayActivities]);

  // Calculate diaper stats
  const diaperStats = useMemo(() => {
    const diaperActivities = todayActivities.filter(
      (a) => a.type === 'diaper' || a.type === 'wet' || a.type === 'dirty',
    );
    const wetCount = diaperActivities.filter(
      (a) =>
        a.details &&
        typeof a.details === 'object' &&
        'type' in a.details &&
        (a.details.type === 'wet' || a.details.type === 'both'),
    ).length;
    const dirtyCount = diaperActivities.filter(
      (a) =>
        a.details &&
        typeof a.details === 'object' &&
        'type' in a.details &&
        (a.details.type === 'dirty' || a.details.type === 'both'),
    ).length;
    return {
      dirty: dirtyCount,
      total: diaperActivities.length,
      wet: wetCount,
    };
  }, [todayActivities]);

  // Calculate sleep stats
  const sleepStats = useMemo(() => {
    const sleepActivities = todayActivities.filter(
      (a) => a.type === 'sleep' && a.duration && a.duration > 0,
    );
    const totalMinutes = sleepActivities.reduce(
      (sum, a) => sum + (a.duration || 0),
      0,
    );
    const totalHours = totalMinutes / 60;
    return {
      count: sleepActivities.length,
      totalHours,
      totalMinutes,
    };
  }, [todayActivities]);

  // Format volume based on unit
  const formatVolume = (ml: number): string => {
    if (measurementUnit === 'imperial') {
      const oz = ml / 29.5735; // 1 oz = 29.5735 ml
      return `${Math.round(oz * 10) / 10} oz`;
    }
    return `${Math.round(ml)} ml`;
  };

  // Calculate activity type stats
  const activityTypeStats = useMemo(() => {
    const periodActivities =
      activityPeriod === 'week' ? weekActivities : monthActivities;
    const periodDays = activityPeriod === 'week' ? 7 : 30;

    const stats = {
      bath: periodActivities.filter((a) => a.type === 'bath').length,
      contrastTime: periodActivities.filter((a) => a.type === 'contrast_time')
        .length,
      doctorVisit: periodActivities.filter((a) => a.type === 'doctor_visit')
        .length,
      nailTrimming: periodActivities.filter((a) => a.type === 'nail_trimming')
        .length,
      pumping: periodActivities.filter((a) => a.type === 'pumping').length,
      solids: periodActivities.filter((a) => a.type === 'solids').length,
      vitaminD: periodActivities.filter((a) => a.type === 'vitamin_d').length,
      walk: periodActivities.filter((a) => a.type === 'walk').length,
    };

    // Get last activity dates
    const getLastActivity = (type: string) => {
      const filtered = periodActivities
        .filter((a) => a.type === type)
        .sort(
          (a, b) =>
            new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
        );
      return filtered[0] ? new Date(filtered[0].startTime) : null;
    };

    return {
      ...stats,
      lastBath: getLastActivity('bath'),
      lastContrastTime: getLastActivity('contrast_time'),
      lastDoctorVisit: getLastActivity('doctor_visit'),
      lastNailTrimming: getLastActivity('nail_trimming'),
      lastSolids: getLastActivity('solids'),
      lastVitaminD: getLastActivity('vitamin_d'),
      lastWalk: getLastActivity('walk'),
      periodDays,
    };
  }, [weekActivities, monthActivities, activityPeriod]);

  // Calculate fun stats
  const funStats = useMemo(() => {
    if (activities.length === 0) {
      return null;
    }

    // Total activities logged
    const totalActivities = activities.length;

    // Days since first activity
    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const firstActivity = sortedActivities[0];
    const daysSinceFirst = firstActivity
      ? Math.floor(
          (Date.now() - new Date(firstActivity.startTime).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;

    // Most active day
    const activitiesByDay = new Map<string, number>();
    activities.forEach((activity) => {
      const day = format(new Date(activity.startTime), 'yyyy-MM-dd');
      activitiesByDay.set(day, (activitiesByDay.get(day) || 0) + 1);
    });
    let maxCount = 0;
    let mostActiveDay: string | null = null;
    activitiesByDay.forEach((count, day) => {
      if (count > maxCount) {
        maxCount = count;
        mostActiveDay = day;
      }
    });

    // Average activities per day (last 7 days)
    const last7Days = activities.filter(
      (a) => new Date(a.startTime) >= startOfDay(subDays(new Date(), 7)),
    );
    const avgPerDay7d = last7Days.length / 7;

    // Average activities per day (last 30 days)
    const last30Days = activities.filter(
      (a) => new Date(a.startTime) >= startOfDay(subDays(new Date(), 30)),
    );
    const avgPerDay30d = last30Days.length / 30;

    // Longest sleep session
    const sleepActivities = activities.filter(
      (a) => a.type === 'sleep' && a.duration,
    );
    const longestSleep = sleepActivities.reduce((max, activity) => {
      return (activity.duration || 0) > (max.duration || 0) ? activity : max;
    }, sleepActivities[0] || null);

    // Total volume fed (all time)
    const feedingActivities = activities.filter(
      (a) =>
        (a.type === 'bottle' || a.type === 'nursing' || a.type === 'feeding') &&
        a.amountMl,
    );
    const totalVolumeMl = feedingActivities.reduce(
      (sum, a) => sum + (a.amountMl || 0),
      0,
    );

    // Total diapers changed (all time)
    const totalDiapers = activities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    ).length;

    return {
      avgPerDay7d,
      avgPerDay30d,
      daysSinceFirst,
      longestSleep,
      mostActiveDay,
      mostActiveDayCount: maxCount,
      totalActivities,
      totalDiapers,
      totalVolumeMl,
    };
  }, [activities]);

  // Calculate trend data
  const trendData = useMemo(
    () => calculateAllActivitiesTrendData(activities, trendTimeRange),
    [activities, trendTimeRange],
  );

  // Calculate activity distribution
  const activityDistribution = useMemo(
    () => calculateActivityTypeDistribution(activities, 7),
    [activities],
  );

  // Calculate frequency heatmap data
  const heatmapData = useMemo(() => {
    // Use last 30 days for heatmap
    const cutoff = startOfDay(subDays(new Date(), 30));
    const recentActivities = activities.filter(
      (a) => new Date(a.startTime) >= cutoff,
    );
    return calculateHourlyFrequency(recentActivities, 'count');
  }, [activities]);

  // Calculate time block data
  const timeBlockData = useMemo(
    () => calculateTimeBlockData(activities, 7, 0),
    [activities],
  );

  // Calculate streaks
  const streaks = useMemo(() => calculateStreaks(activities), [activities]);

  // Calculate real-world comparisons
  const comparisons = useMemo(() => {
    const totalDiapers = activities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    ).length;
    const totalVolumeMl = activities
      .filter(
        (a) =>
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'feeding') &&
          a.amountMl,
      )
      .reduce((sum, a) => sum + (a.amountMl || 0), 0);
    const totalSleepHours = activities
      .filter((a) => a.type === 'sleep' && a.duration)
      .reduce((sum, a) => sum + (a.duration || 0) / 60, 0);
    const totalVitaminD = activities.filter(
      (a) => a.type === 'vitamin_d',
    ).length;
    const totalWalks = activities.filter((a) => a.type === 'walk').length;
    const totalNailTrimming = activities.filter(
      (a) => a.type === 'nail_trimming',
    ).length;
    const totalContrastTime = activities.filter(
      (a) => a.type === 'contrast_time',
    ).length;
    return calculateRealWorldComparisons(
      totalDiapers,
      totalVolumeMl,
      totalSleepHours,
      activities.length,
      totalVitaminD,
      totalWalks,
      totalNailTrimming,
      totalContrastTime,
    );
  }, [activities]);

  // Calculate patterns
  const patterns = useMemo(() => calculatePatterns(activities), [activities]);

  // Calculate records
  const records = useMemo(() => calculateRecords(activities), [activities]);

  // Calculate milestones
  const milestones = useMemo(() => {
    const totalDiapers = activities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    ).length;
    const totalVolumeMl = activities
      .filter(
        (a) =>
          (a.type === 'bottle' ||
            a.type === 'nursing' ||
            a.type === 'feeding') &&
          a.amountMl,
      )
      .reduce((sum, a) => sum + (a.amountMl || 0), 0);
    const sortedActivities = [...activities].sort(
      (a, b) =>
        new Date(a.startTime).getTime() - new Date(b.startTime).getTime(),
    );
    const daysTracking = sortedActivities[0]
      ? Math.floor(
          (Date.now() - new Date(sortedActivities[0].startTime).getTime()) /
            (1000 * 60 * 60 * 24),
        )
      : 0;
    return calculateMilestones(
      activities.length,
      totalVolumeMl,
      totalDiapers,
      daysTracking,
    );
  }, [activities]);

  // Calculate humorous stats
  const humorousStats = useMemo(() => {
    const diaperActivities = activities.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    );
    if (diaperActivities.length < 2) return null;

    // Average time between diaper changes
    const diaperTimes = diaperActivities
      .map((a) => new Date(a.startTime).getTime())
      .sort((a, b) => a - b);
    const gaps: number[] = [];
    for (let i = 1; i < diaperTimes.length; i++) {
      gaps.push((diaperTimes[i]! - diaperTimes[i - 1]!) / (1000 * 60));
    }
    const avgDiaperGap =
      gaps.length > 0 ? gaps.reduce((a, b) => a + b, 0) / gaps.length : 0;

    // Most activities in one hour
    const activitiesByHour = new Map<string, number>();
    activities.forEach((activity) => {
      const hour = format(new Date(activity.startTime), 'yyyy-MM-dd-HH');
      activitiesByHour.set(hour, (activitiesByHour.get(hour) || 0) + 1);
    });
    let maxInHour = 0;
    activitiesByHour.forEach((count) => {
      if (count > maxInHour) maxInHour = count;
    });

    // Sleep efficiency
    const totalTime =
      activities.length > 0
        ? (Date.now() -
            new Date(
              activities.reduce(
                (earliest, a) =>
                  new Date(a.startTime) < new Date(earliest.startTime)
                    ? a
                    : earliest,
                activities[0]!,
              ).startTime,
            ).getTime()) /
          (1000 * 60 * 60)
        : 0;
    const totalSleepHours = activities
      .filter((a) => a.type === 'sleep' && a.duration)
      .reduce((sum, a) => sum + (a.duration || 0) / 60, 0);
    const sleepEfficiency =
      totalTime > 0 ? (totalSleepHours / totalTime) * 100 : 0;

    return {
      avgDiaperGap: Math.round(avgDiaperGap),
      maxInHour,
      sleepEfficiency: Math.round(sleepEfficiency * 10) / 10,
    };
  }, [activities]);

  // Calculate level based on total activities
  const level = useMemo(() => {
    const total = activities.length;
    if (total >= 5000) return { level: 10, name: 'Master Tracker' };
    if (total >= 2500) return { level: 9, name: 'Expert Parent' };
    if (total >= 1000) return { level: 8, name: 'Pro Tracker' };
    if (total >= 500) return { level: 7, name: 'Dedicated Parent' };
    if (total >= 250) return { level: 6, name: 'Consistent Tracker' };
    if (total >= 100) return { level: 5, name: 'Active Parent' };
    if (total >= 50) return { level: 4, name: 'Regular Tracker' };
    if (total >= 25) return { level: 3, name: 'Getting Started' };
    if (total >= 10) return { level: 2, name: 'New Parent' };
    return { level: 1, name: 'Just Beginning' };
  }, [activities.length]);

  return (
    <StatsDrawerWrapper
      onOpenChange={onOpenChange}
      open={open}
      title="Baby Stats"
    >
      <div className="space-y-4">
        {/* Age and Weight Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">Overview</h3>
          <div className="grid grid-cols-2 gap-3">
            {ageDays !== null && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Age</div>
                <div className="text-2xl font-bold text-foreground">
                  {formatAge(ageDays)}
                </div>
              </Card>
            )}
            {estimatedWeightOz !== null && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Estimated Weight
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatWeightDisplay(estimatedWeightOz, measurementUnit)}
                </div>
              </Card>
            )}
            {baby?.currentWeightOz && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Current Weight
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatWeightDisplay(baby.currentWeightOz, measurementUnit)}
                </div>
              </Card>
            )}
            {baby?.birthWeightOz && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Birth Weight
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {formatWeightDisplay(baby.birthWeightOz, measurementUnit)}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Feeding Stats Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            Today's Feedings
          </h3>
          <div className="grid grid-cols-3 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">Total</div>
              <div className="text-2xl font-bold text-foreground">
                {feedingStats.count}
              </div>
            </Card>
            {feedingStats.totalMl > 0 && (
              <>
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Total Volume
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {formatVolume(feedingStats.totalMl)}
                  </div>
                </Card>
                {feedingStats.avgAmountMl !== null && (
                  <Card className="p-4">
                    <div className="text-xs text-muted-foreground mb-1">
                      Average
                    </div>
                    <div className="text-2xl font-bold text-foreground">
                      {formatVolume(feedingStats.avgAmountMl)}
                    </div>
                  </Card>
                )}
              </>
            )}
          </div>
          {/* Bottle vs Nursing breakdown */}
          {feedingStats.count > 0 && (
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Bottle</div>
                <div className="text-xl font-semibold text-foreground">
                  {
                    todayActivities.filter(
                      (a) =>
                        a.type === 'bottle' ||
                        (a.type === 'feeding' &&
                          a.details &&
                          typeof a.details === 'object' &&
                          'type' in a.details &&
                          a.details.type === 'bottle'),
                    ).length
                  }
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Nursing
                </div>
                <div className="text-xl font-semibold text-foreground">
                  {
                    todayActivities.filter(
                      (a) =>
                        a.type === 'nursing' ||
                        (a.type === 'feeding' &&
                          a.details &&
                          typeof a.details === 'object' &&
                          'type' in a.details &&
                          a.details.type === 'nursing'),
                    ).length
                  }
                </div>
              </Card>
            </div>
          )}
        </div>

        {/* Diaper Stats Section */}
        {diaperStats.total > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Today's Diapers
            </h3>
            <div className="grid grid-cols-3 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Total</div>
                <div className="text-2xl font-bold text-foreground">
                  {diaperStats.total}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Wet</div>
                <div className="text-2xl font-bold text-foreground">
                  {diaperStats.wet}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Dirty</div>
                <div className="text-2xl font-bold text-foreground">
                  {diaperStats.dirty}
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Sleep Stats Section */}
        {sleepStats.count > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Today's Sleep
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Sessions
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {sleepStats.count}
                </div>
              </Card>
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Hours
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {Math.round(sleepStats.totalHours * 10) / 10}h
                </div>
              </Card>
            </div>
          </div>
        )}

        {/* Activity Type Stats Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h3 className="text-sm font-semibold text-foreground">
              Activity Types (
              {activityPeriod === 'week' ? 'This Week' : 'Last 30 Days'})
            </h3>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {activityPeriod === 'week' ? 'This Week' : 'Last 30 Days'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setActivityPeriod('week')}>
                  This Week
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setActivityPeriod('month')}>
                  Last 30 Days
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {activityTypeStats.bath > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Bath</div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.bath}
                </div>
                {activityTypeStats.lastBath && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(activityTypeStats.lastBath, 'MMM d')}
                  </div>
                )}
              </Card>
            )}
            {activityTypeStats.vitaminD > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Vitamin D
                </div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.vitaminD}
                </div>
                {activityTypeStats.lastVitaminD && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(activityTypeStats.lastVitaminD, 'MMM d')}
                  </div>
                )}
              </Card>
            )}
            {activityTypeStats.nailTrimming > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Nail Trimming
                </div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.nailTrimming}
                </div>
                {activityTypeStats.lastNailTrimming && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(activityTypeStats.lastNailTrimming, 'MMM d')}
                  </div>
                )}
              </Card>
            )}
            {activityTypeStats.solids > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Solids</div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.solids}
                </div>
                {activityTypeStats.lastSolids && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(activityTypeStats.lastSolids, 'MMM d')}
                  </div>
                )}
              </Card>
            )}
            {activityTypeStats.pumping > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Pumping
                </div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.pumping}
                </div>
              </Card>
            )}
            {activityTypeStats.doctorVisit > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Doctor Visit
                </div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.doctorVisit}
                </div>
                {activityTypeStats.lastDoctorVisit && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(activityTypeStats.lastDoctorVisit, 'MMM d')}
                  </div>
                )}
              </Card>
            )}
            {activityTypeStats.walk > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">Walk</div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.walk}
                </div>
                {activityTypeStats.lastWalk && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(activityTypeStats.lastWalk, 'MMM d')}
                  </div>
                )}
              </Card>
            )}
            {activityTypeStats.contrastTime > 0 && (
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Contrast Time
                </div>
                <div className="text-xl font-bold text-foreground">
                  {activityTypeStats.contrastTime}
                </div>
                {activityTypeStats.lastContrastTime && (
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(activityTypeStats.lastContrastTime, 'MMM d')}
                  </div>
                )}
              </Card>
            )}
          </div>
        </div>

        {/* Level & Gamification Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            🏆 Your Level
          </h3>
          <Card className="p-4 bg-gradient-to-br from-primary/10 to-primary/5">
            <div className="flex items-center justify-between">
              <div>
                <div className="text-xs text-muted-foreground mb-1">
                  Level {level.level}
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {level.name}
                </div>
                <div className="text-xs text-muted-foreground mt-1">
                  {activities.length} activities logged
                </div>
              </div>
              <div className="text-4xl">🏅</div>
            </div>
          </Card>
        </div>

        {/* Streaks Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">🔥 Streaks</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Feeding Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.feeding.current} days
              </div>
              {streaks.feeding.longest > streaks.feeding.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.feeding.longest} days
                </div>
              )}
              {streaks.feeding.current >= 7 && (
                <div className="text-xs text-primary mt-1">🔥 On fire!</div>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Diaper Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.diaper.current} days
              </div>
              {streaks.diaper.longest > streaks.diaper.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.diaper.longest} days
                </div>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Sleep Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.sleep.current} days
              </div>
              {streaks.sleep.longest > streaks.sleep.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.sleep.longest} days
                </div>
              )}
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Perfect Day Streak
              </div>
              <div className="text-2xl font-bold text-foreground">
                {streaks.perfectDay.current} days
              </div>
              {streaks.perfectDay.longest > streaks.perfectDay.current && (
                <div className="text-xs text-muted-foreground mt-1">
                  Best: {streaks.perfectDay.longest} days
                </div>
              )}
              {streaks.perfectDay.current >= 3 && (
                <div className="text-xs text-primary mt-1">⭐ Perfect!</div>
              )}
            </Card>
          </div>
        </div>

        {/* Real-World Comparisons Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            🌍 Real-World Comparisons
          </h3>
          <div className="space-y-2">
            <Card className="p-4 bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Diaper Mountain
              </div>
              <div className="text-base text-foreground">
                {comparisons.diaper}
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-yellow-50 to-yellow-100 dark:from-yellow-950 dark:to-yellow-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Milk Ocean
              </div>
              <div className="text-base text-foreground">
                {comparisons.milk}
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Sleep Champion
              </div>
              <div className="text-base text-foreground">
                {comparisons.sleep}
              </div>
            </Card>
            <Card className="p-4 bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900">
              <div className="text-sm font-medium text-foreground mb-1">
                Activity Marathon
              </div>
              <div className="text-base text-foreground">
                {comparisons.activities}
              </div>
            </Card>
            {activities.filter((a) => a.type === 'vitamin_d').length > 0 && (
              <Card className="p-4 bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900">
                <div className="text-sm font-medium text-foreground mb-1">
                  Vitamin D Sunshine
                </div>
                <div className="text-base text-foreground">
                  {comparisons.vitaminD}
                </div>
              </Card>
            )}
            {activities.filter((a) => a.type === 'walk').length > 0 && (
              <Card className="p-4 bg-gradient-to-br from-teal-50 to-teal-100 dark:from-teal-950 dark:to-teal-900">
                <div className="text-sm font-medium text-foreground mb-1">
                  Walking Adventures
                </div>
                <div className="text-base text-foreground">
                  {comparisons.walks}
                </div>
              </Card>
            )}
            {activities.filter((a) => a.type === 'nail_trimming').length >
              0 && (
              <Card className="p-4 bg-gradient-to-br from-pink-50 to-pink-100 dark:from-pink-950 dark:to-pink-900">
                <div className="text-sm font-medium text-foreground mb-1">
                  Nail Trimming Master
                </div>
                <div className="text-base text-foreground">
                  {comparisons.nailTrimming}
                </div>
              </Card>
            )}
            {activities.filter((a) => a.type === 'contrast_time').length >
              0 && (
              <Card className="p-4 bg-gradient-to-br from-indigo-50 to-indigo-100 dark:from-indigo-950 dark:to-indigo-900">
                <div className="text-sm font-medium text-foreground mb-1">
                  Contrast Time Champion
                </div>
                <div className="text-base text-foreground">
                  {comparisons.contrastTime}
                </div>
              </Card>
            )}
          </div>
        </div>

        {/* Pattern Recognition Section */}
        <div className="space-y-3">
          <h3 className="text-sm font-semibold text-foreground">
            🎯 Your Patterns
          </h3>
          <div className="grid grid-cols-2 gap-3">
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                {patterns.nightOwl ? '🦉 Night Owl' : '🐦 Early Bird'}
              </div>
              <div className="text-sm font-semibold text-foreground">
                Most active at {patterns.mostProductiveHour}:00
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Feeding Style
              </div>
              <div className="text-sm font-semibold text-foreground">
                {patterns.feedingStyle === 'bottle'
                  ? '🍼 Bottle Enthusiast'
                  : patterns.feedingStyle === 'nursing'
                    ? '🤱 Nursing Pro'
                    : '⚖️ Balanced Feeder'}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Weekend Warrior
              </div>
              <div className="text-sm font-semibold text-foreground">
                {patterns.weekendWarrior.weekend >
                patterns.weekendWarrior.weekday
                  ? `Weekend: ${patterns.weekendWarrior.weekend}`
                  : `Weekday: ${patterns.weekendWarrior.weekday}`}
              </div>
            </Card>
            <Card className="p-4">
              <div className="text-xs text-muted-foreground mb-1">
                Tracking Accuracy
              </div>
              <div className="text-sm font-semibold text-foreground">
                {patterns.trackingAccuracy}% 🎯
              </div>
            </Card>
          </div>
        </div>

        {/* Records Section */}
        {records.longestSleep ||
        records.mostFeedingsInDay ||
        records.mostActiveDay ? (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              🏅 Personal Records
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {records.longestSleep && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Longest Sleep
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {Math.round((records.longestSleep.duration / 60) * 10) / 10}
                    h
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(records.longestSleep.date, 'MMM d, yyyy')}
                  </div>
                </Card>
              )}
              {records.mostFeedingsInDay && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Most Feedings (Day)
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {records.mostFeedingsInDay.count}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(records.mostFeedingsInDay.date, 'MMM d, yyyy')}
                  </div>
                </Card>
              )}
              {records.mostActiveDay && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Most Active Day
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {records.mostActiveDay.count} activities
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(records.mostActiveDay.date, 'MMM d, yyyy')}
                  </div>
                </Card>
              )}
              {records.fastestFeeding && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Fastest Feeding Gap
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {records.fastestFeeding.minutes} min
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(records.fastestFeeding.date, 'MMM d, yyyy')}
                  </div>
                </Card>
              )}
              {records.longestGap && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Longest Break
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {records.longestGap.hours}h
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(records.longestGap.date, 'MMM d, yyyy')}
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : null}

        {/* Milestones Section */}
        {(milestones.activityMilestone ||
          milestones.volumeMilestone ||
          milestones.diaperMilestone ||
          milestones.daysMilestone) && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              🎯 Milestones
            </h3>
            <div className="space-y-3">
              {milestones.activityMilestone && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Activities
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {activities.length.toLocaleString()} /{' '}
                        {milestones.activityMilestone.next.toLocaleString()}
                      </div>
                    </div>
                    <div className="text-lg">
                      {milestones.activityMilestone.progress >= 75
                        ? '🎉'
                        : milestones.activityMilestone.progress >= 50
                          ? '🎯'
                          : '📈'}
                    </div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, milestones.activityMilestone.progress)}%`,
                      }}
                    />
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {milestones.activityMilestone.next - activities.length} more
                    to next milestone!
                  </div>
                </Card>
              )}
              {milestones.volumeMilestone && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Volume Fed
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {formatVolume(
                          activities
                            .filter(
                              (a) =>
                                (a.type === 'bottle' ||
                                  a.type === 'nursing' ||
                                  a.type === 'feeding') &&
                                a.amountMl,
                            )
                            .reduce((sum, a) => sum + (a.amountMl || 0), 0),
                        )}{' '}
                        / {formatVolume(milestones.volumeMilestone.next)}
                      </div>
                    </div>
                    <div className="text-lg">🥛</div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, milestones.volumeMilestone.progress)}%`,
                      }}
                    />
                  </div>
                </Card>
              )}
              {milestones.diaperMilestone && (
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <div>
                      <div className="text-xs text-muted-foreground mb-1">
                        Diapers Changed
                      </div>
                      <div className="text-sm font-semibold text-foreground">
                        {
                          activities.filter(
                            (a) =>
                              a.type === 'diaper' ||
                              a.type === 'wet' ||
                              a.type === 'dirty' ||
                              a.type === 'both',
                          ).length
                        }{' '}
                        / {milestones.diaperMilestone.next}
                      </div>
                    </div>
                    <div className="text-lg">👶</div>
                  </div>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-primary h-2 rounded-full transition-all"
                      style={{
                        width: `${Math.min(100, milestones.diaperMilestone.progress)}%`,
                      }}
                    />
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Humorous Stats Section */}
        {humorousStats && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              😄 Fun Facts
            </h3>
            <div className="grid grid-cols-2 gap-3">
              {humorousStats.avgDiaperGap > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Diaper Change Speed
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {humorousStats.avgDiaperGap} min avg
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    You're on it! ⚡
                  </div>
                </Card>
              )}
              {humorousStats.maxInHour > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Activity Density
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {humorousStats.maxInHour} in 1 hour
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    You're a pro! 🚀
                  </div>
                </Card>
              )}
              {humorousStats.sleepEfficiency > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Sleep Efficiency
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {humorousStats.sleepEfficiency}%
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {humorousStats.sleepEfficiency > 50
                      ? 'More than a cat! 🐱'
                      : 'Sweet dreams! 💤'}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Fun Stats Section */}
        {funStats && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              📊 Fun Stats
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
              <Card className="p-4">
                <div className="text-xs text-muted-foreground mb-1">
                  Total Activities
                </div>
                <div className="text-2xl font-bold text-foreground">
                  {funStats.totalActivities.toLocaleString()}
                </div>
              </Card>
              {funStats.daysSinceFirst > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Days Tracking
                  </div>
                  <div className="text-2xl font-bold text-foreground">
                    {funStats.daysSinceFirst}
                  </div>
                </Card>
              )}
              {funStats.mostActiveDay && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Most Active Day
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {funStats.mostActiveDayCount}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {format(new Date(funStats.mostActiveDay), 'MMM d, yyyy')}
                  </div>
                </Card>
              )}
              {funStats.avgPerDay7d > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Avg/Day (7d)
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {Math.round(funStats.avgPerDay7d * 10) / 10}
                  </div>
                </Card>
              )}
              {funStats.avgPerDay30d > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Avg/Day (30d)
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {Math.round(funStats.avgPerDay30d * 10) / 10}
                  </div>
                </Card>
              )}
              {funStats.longestSleep?.duration && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Longest Sleep
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {Math.round(
                      ((funStats.longestSleep.duration || 0) / 60) * 10,
                    ) / 10}
                    h
                  </div>
                </Card>
              )}
              {funStats.totalVolumeMl > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Total Volume Fed
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {formatVolume(funStats.totalVolumeMl)}
                  </div>
                </Card>
              )}
              {funStats.totalDiapers > 0 && (
                <Card className="p-4">
                  <div className="text-xs text-muted-foreground mb-1">
                    Total Diapers
                  </div>
                  <div className="text-xl font-bold text-foreground">
                    {funStats.totalDiapers.toLocaleString()}
                  </div>
                </Card>
              )}
            </div>
          </div>
        )}

        {/* Trend Chart Section */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-foreground">
                Activity Trend
              </h3>
              <p className="text-xs text-muted-foreground">
                Total activities over time
              </p>
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button size="sm" variant="outline">
                  {trendTimeRange === '24h'
                    ? '24 Hours'
                    : trendTimeRange === '7d'
                      ? '7 Days'
                      : trendTimeRange === '2w'
                        ? '2 Weeks'
                        : trendTimeRange === '1m'
                          ? '1 Month'
                          : trendTimeRange === '3m'
                            ? '3 Months'
                            : '6 Months'}
                  <ChevronDown className="ml-1 size-3" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => setTrendTimeRange('24h')}>
                  24 Hours
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTrendTimeRange('7d')}>
                  7 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTrendTimeRange('2w')}>
                  2 Weeks
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTrendTimeRange('1m')}>
                  1 Month
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTrendTimeRange('3m')}>
                  3 Months
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => setTrendTimeRange('6m')}>
                  6 Months
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          <Card className="p-4">
            <GenericTrendChart data={trendData} timeRange={trendTimeRange} />
          </Card>
        </div>

        {/* Activity Distribution Section */}
        {activityDistribution.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Activity Distribution (Last 7 Days)
            </h3>
            <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
              {activityDistribution.slice(0, 9).map((item) => (
                <Card className="p-3" key={item.type}>
                  <div className="text-xs text-muted-foreground mb-1">
                    {item.label}
                  </div>
                  <div className="text-lg font-bold text-foreground">
                    {item.count}
                  </div>
                </Card>
              ))}
            </div>
          </div>
        )}

        {/* Frequency Heatmap Section */}
        {heatmapData.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Activity Frequency (Last 30 Days)
            </h3>
            <Card className="p-4">
              <FrequencyHeatmap
                colorVar="var(--activity-feeding)"
                data={heatmapData}
                metric="count"
              />
            </Card>
          </div>
        )}

        {/* Time Block Chart Section */}
        {timeBlockData.length > 0 && (
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-foreground">
              Activity Timeline (Last 7 Days)
            </h3>
            <Card className="p-4">
              <TimeBlockChart
                colorVar="var(--activity-feeding)"
                data={timeBlockData}
              />
            </Card>
          </div>
        )}

        {/* Missing Data Message */}
        {!baby?.birthWeightOz && (
          <Card className="p-4 bg-muted/50">
            <div className="text-sm text-muted-foreground">
              Add birth weight in settings to see estimated weight calculations.
            </div>
          </Card>
        )}
      </div>
    </StatsDrawerWrapper>
  );
}
