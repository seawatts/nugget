import { currentUser } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { Activities, FamilyMembers, Users } from '@nugget/db/schema';
import { differenceInMinutes } from 'date-fns';
import { eq } from 'drizzle-orm';
import { NextResponse } from 'next/server';
import { predictNextDiaper } from '~/app/(app)/app/_components/activities/diaper/prediction';
import { predictNextFeeding } from '~/app/(app)/app/_components/activities/feeding/prediction';
import { predictNextPumping } from '~/app/(app)/app/_components/activities/pumping/prediction';
import { predictNextSleep } from '~/app/(app)/app/_components/activities/sleep/prediction';
import { getOverdueThreshold } from '~/app/(app)/app/_components/shared/overdue-thresholds';

interface OverdueActivity {
  activityType: 'feeding' | 'sleep' | 'diaper' | 'pumping';
  babyName: string;
  babyId: string;
  overdueMinutes: number;
  nextExpectedTime: string;
}

export async function GET() {
  try {
    // Get the current user
    const clerkUser = await currentUser();
    if (!clerkUser) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Get user from database with alarm preferences
    const user = await db.query.Users.findFirst({
      where: eq(Users.clerkId, clerkUser.id),
    });

    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Check if any alarms are enabled
    const hasAnyAlarmsEnabled =
      user.alarmFeedingEnabled ||
      user.alarmSleepEnabled ||
      user.alarmDiaperEnabled ||
      user.alarmPumpingEnabled;

    if (!hasAnyAlarmsEnabled) {
      return NextResponse.json({ overdueActivities: [] });
    }

    // Get all family memberships for this user
    const familyMemberships = await db.query.FamilyMembers.findMany({
      where: eq(FamilyMembers.userId, user.id),
    });

    if (familyMemberships.length === 0) {
      return NextResponse.json({ overdueActivities: [] });
    }

    const familyIds = familyMemberships.map((fm) => fm.familyId);

    // Get all babies for these families
    const babies = await db.query.Babies.findMany({
      where: (babies, { inArray }) => inArray(babies.familyId, familyIds),
    });

    if (babies.length === 0) {
      return NextResponse.json({ overdueActivities: [] });
    }

    const overdueActivities: OverdueActivity[] = [];

    // Check each baby for overdue activities
    for (const baby of babies) {
      const babyName = baby.firstName;
      const babyBirthDate = baby.birthDate;

      // Get recent activities for this baby
      const recentActivities = await db.query.Activities.findMany({
        limit: 50,
        orderBy: (activities, { desc }) => [desc(activities.startTime)],
        where: eq(Activities.babyId, baby.id),
      });

      const now = new Date();

      // Check feeding if enabled
      if (user.alarmFeedingEnabled) {
        const prediction = predictNextFeeding(
          recentActivities,
          babyBirthDate,
          baby.feedIntervalHours,
        );

        const threshold =
          user.alarmFeedingThreshold ||
          getOverdueThreshold(
            'feeding',
            babyBirthDate ? differenceInDays(now, babyBirthDate) : null,
          );

        const minutesUntil = differenceInMinutes(
          prediction.nextFeedingTime,
          now,
        );
        const isOverdue = minutesUntil < -threshold;

        if (isOverdue) {
          overdueActivities.push({
            activityType: 'feeding',
            babyId: baby.id,
            babyName,
            nextExpectedTime: prediction.nextFeedingTime.toISOString(),
            overdueMinutes: Math.abs(minutesUntil),
          });
        }
      }

      // Check sleep if enabled
      if (user.alarmSleepEnabled) {
        const prediction = predictNextSleep(recentActivities, babyBirthDate);

        const threshold =
          user.alarmSleepThreshold ||
          getOverdueThreshold(
            'sleep',
            babyBirthDate ? differenceInDays(now, babyBirthDate) : null,
          );

        const minutesUntil = differenceInMinutes(prediction.nextSleepTime, now);
        const isOverdue = minutesUntil < -threshold;

        if (isOverdue) {
          overdueActivities.push({
            activityType: 'sleep',
            babyId: baby.id,
            babyName,
            nextExpectedTime: prediction.nextSleepTime.toISOString(),
            overdueMinutes: Math.abs(minutesUntil),
          });
        }
      }

      // Check diaper if enabled
      if (user.alarmDiaperEnabled) {
        const prediction = predictNextDiaper(recentActivities, babyBirthDate);

        const threshold =
          user.alarmDiaperThreshold ||
          getOverdueThreshold(
            'diaper',
            babyBirthDate ? differenceInDays(now, babyBirthDate) : null,
          );

        const minutesUntil = differenceInMinutes(
          prediction.nextDiaperTime,
          now,
        );
        const isOverdue = minutesUntil < -threshold;

        if (isOverdue) {
          overdueActivities.push({
            activityType: 'diaper',
            babyId: baby.id,
            babyName,
            nextExpectedTime: prediction.nextDiaperTime.toISOString(),
            overdueMinutes: Math.abs(minutesUntil),
          });
        }
      }

      // Check pumping if enabled
      if (user.alarmPumpingEnabled) {
        const prediction = predictNextPumping(recentActivities, babyBirthDate);

        const threshold =
          user.alarmPumpingThreshold ||
          getOverdueThreshold(
            'pumping',
            babyBirthDate ? differenceInDays(now, babyBirthDate) : null,
          );

        const minutesUntil = differenceInMinutes(
          prediction.nextPumpingTime,
          now,
        );
        const isOverdue = minutesUntil < -threshold;

        if (isOverdue) {
          overdueActivities.push({
            activityType: 'pumping',
            babyId: baby.id,
            babyName,
            nextExpectedTime: prediction.nextPumpingTime.toISOString(),
            overdueMinutes: Math.abs(minutesUntil),
          });
        }
      }
    }

    return NextResponse.json({ overdueActivities });
  } catch (error) {
    console.error('Error checking overdue activities:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 },
    );
  }
}

// Helper function to calculate age in days
function differenceInDays(date1: Date, date2: Date): number {
  const msPerDay = 1000 * 60 * 60 * 24;
  const utc1 = Date.UTC(date1.getFullYear(), date1.getMonth(), date1.getDate());
  const utc2 = Date.UTC(date2.getFullYear(), date2.getMonth(), date2.getDate());
  return Math.floor((utc1 - utc2) / msPerDay);
}
