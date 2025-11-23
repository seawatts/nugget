'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { format } from 'date-fns';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

export interface DoctorVisitSummaryData {
  dateRange: {
    startDate: Date;
    endDate: Date;
    dayCount: number;
  };
  lastVisitDate: Date | null;
  feeding: {
    total: number;
    averagePerDay: number;
    byDay: Array<{ date: string; count: number; totalMl: number }>;
    totalMl: number;
    averageMlPerFeeding: number;
  };
  sleep: {
    total: number;
    totalMinutes: number;
    averageHoursPerDay: number;
    byDay: Array<{ date: string; count: number; totalMinutes: number }>;
    longestSleepMinutes: number;
  };
  diaper: {
    total: number;
    averagePerDay: number;
    wet: number;
    dirty: number;
    both: number;
    byDay: Array<{ date: string; wet: number; dirty: number; both: number }>;
  };
  babyInfo: {
    name: string;
    ageDays: number;
    birthDate: Date | null;
  };
}

/**
 * Calculate baby's age in days from birth date
 */
function calculateBabyAgeDays(birthDate: Date | null): number {
  if (!birthDate) return 0;
  const now = new Date();
  const diffTime = now.getTime() - new Date(birthDate).getTime();
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
  return diffDays;
}

/**
 * Format date as YYYY-MM-DD for grouping using local timezone
 */
function formatDate(date: Date): string {
  return format(date, 'yyyy-MM-dd');
}

/**
 * Get doctor visit summary data for a given date range
 */
export const getDoctorVisitSummaryAction = action
  .schema(
    z.object({
      babyId: z.string().optional(),
      endDate: z.date(),
      startDate: z.date(),
    }),
  )
  .action(async ({ parsedInput }): Promise<DoctorVisitSummaryData> => {
    const { startDate, endDate, babyId: inputBabyId } = parsedInput;

    // Verify authentication
    const authResult = await auth();
    if (!authResult.userId || !authResult.orgId) {
      throw new Error('Authentication required');
    }

    // Create tRPC caller
    const api = await getApi();

    // Get the most recent baby if not provided
    const baby = inputBabyId
      ? await api.babies.getById({ id: inputBabyId })
      : await api.babies.getMostRecent();

    if (!baby) {
      throw new Error('No baby found. Please complete onboarding first.');
    }

    const babyAgeDays = calculateBabyAgeDays(baby.birthDate);

    // Calculate day count in range
    const dayCount = Math.ceil(
      (endDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24),
    );

    // Fetch all activities in the date range
    const activities = await api.activities.list({
      babyId: baby.id,
      limit: 100,
    });

    // Filter activities by date range
    const activitiesInRange = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= startDate && activityDate <= endDate;
    });

    // Find last doctor visit (before the start date)
    const doctorVisits = activities.filter(
      (a) => a.type === 'doctor_visit' && new Date(a.startTime) < startDate,
    );
    const lastVisit = doctorVisits[0]; // Already sorted by startTime desc

    // Aggregate feeding data
    const feedingActivities = activitiesInRange.filter(
      (a) =>
        a.type === 'feeding' || a.type === 'bottle' || a.type === 'nursing',
    );
    const feedingByDay = new Map<string, { count: number; totalMl: number }>();

    let totalFeedingMl = 0;
    for (const activity of feedingActivities) {
      const dateKey = formatDate(new Date(activity.startTime));
      const current = feedingByDay.get(dateKey) || { count: 0, totalMl: 0 };
      feedingByDay.set(dateKey, {
        count: current.count + 1,
        totalMl: current.totalMl + (activity.amountMl || 0),
      });
      totalFeedingMl += activity.amountMl || 0;
    }

    // Aggregate sleep data
    const sleepActivities = activitiesInRange.filter((a) => a.type === 'sleep');
    const sleepByDay = new Map<
      string,
      { count: number; totalMinutes: number }
    >();

    let totalSleepMinutes = 0;
    let longestSleepMinutes = 0;
    for (const activity of sleepActivities) {
      const dateKey = formatDate(new Date(activity.startTime));
      const duration = activity.duration || 0;
      const current = sleepByDay.get(dateKey) || { count: 0, totalMinutes: 0 };
      sleepByDay.set(dateKey, {
        count: current.count + 1,
        totalMinutes: current.totalMinutes + duration,
      });
      totalSleepMinutes += duration;
      if (duration > longestSleepMinutes) {
        longestSleepMinutes = duration;
      }
    }

    // Aggregate diaper data
    const diaperActivities = activitiesInRange.filter(
      (a) =>
        a.type === 'diaper' ||
        a.type === 'wet' ||
        a.type === 'dirty' ||
        a.type === 'both',
    );
    const diaperByDay = new Map<
      string,
      { wet: number; dirty: number; both: number }
    >();

    let totalWet = 0;
    let totalDirty = 0;
    let totalBoth = 0;
    for (const activity of diaperActivities) {
      const dateKey = formatDate(new Date(activity.startTime));
      const current = diaperByDay.get(dateKey) || {
        both: 0,
        dirty: 0,
        wet: 0,
      };

      if (activity.type === 'wet') {
        current.wet++;
        totalWet++;
      } else if (activity.type === 'dirty') {
        current.dirty++;
        totalDirty++;
      } else if (activity.type === 'both') {
        current.both++;
        totalBoth++;
      }

      diaperByDay.set(dateKey, current);
    }

    // Convert maps to arrays for charts
    const feedingByDayArray = Array.from(feedingByDay.entries())
      .map(([date, data]) => ({
        count: data.count,
        date,
        totalMl: data.totalMl,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const sleepByDayArray = Array.from(sleepByDay.entries())
      .map(([date, data]) => ({
        count: data.count,
        date,
        totalMinutes: data.totalMinutes,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    const diaperByDayArray = Array.from(diaperByDay.entries())
      .map(([date, data]) => ({
        both: data.both,
        date,
        dirty: data.dirty,
        wet: data.wet,
      }))
      .sort((a, b) => a.date.localeCompare(b.date));

    return {
      babyInfo: {
        ageDays: babyAgeDays,
        birthDate: baby.birthDate,
        name: baby.firstName,
      },
      dateRange: {
        dayCount,
        endDate,
        startDate,
      },
      diaper: {
        averagePerDay: dayCount > 0 ? diaperActivities.length / dayCount : 0,
        both: totalBoth,
        byDay: diaperByDayArray,
        dirty: totalDirty,
        total: diaperActivities.length,
        wet: totalWet,
      },
      feeding: {
        averageMlPerFeeding:
          feedingActivities.length > 0
            ? totalFeedingMl / feedingActivities.length
            : 0,
        averagePerDay: dayCount > 0 ? feedingActivities.length / dayCount : 0,
        byDay: feedingByDayArray,
        total: feedingActivities.length,
        totalMl: totalFeedingMl,
      },
      lastVisitDate: lastVisit ? new Date(lastVisit.startTime) : null,
      sleep: {
        averageHoursPerDay:
          dayCount > 0 ? totalSleepMinutes / 60 / dayCount : 0,
        byDay: sleepByDayArray,
        longestSleepMinutes,
        total: sleepActivities.length,
        totalMinutes: totalSleepMinutes,
      },
    };
  });
