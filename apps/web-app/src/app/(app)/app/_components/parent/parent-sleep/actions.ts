'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import { db } from '@nugget/db/client';
import { Activities } from '@nugget/db/schema';
import { and, eq, gte } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

export interface ParentSleepData {
  lastSleep: {
    startTime: Date;
    endTime: Date | null;
    duration: number;
  } | null;
  totalSleepLast24h: number;
}

/**
 * Log a parent sleep session
 */
export const logParentSleepAction = action
  .schema(
    z.object({
      duration: z.number().min(1),
      endTime: z.date(),
      notes: z.string().optional(),
      startTime: z.date(),
      userId: z.string(),
    }),
  )
  .action(
    async ({
      parsedInput: { userId, startTime, endTime, duration, notes },
    }) => {
      const api = await getApi();
      const authResult = await auth();

      if (!authResult?.orgId) {
        throw new Error('Authentication required');
      }

      const { orgId } = authResult;

      // Get primary baby (required for activities table)
      const babies = await api.babies.list();
      const primaryBaby = babies[0];

      if (!primaryBaby) {
        throw new Error('No baby found');
      }

      // Create sleep activity for the parent
      const [activity] = await db
        .insert(Activities)
        .values({
          babyId: primaryBaby.id,
          details: {
            sleepType: 'night',
            type: 'sleep',
          },
          duration,
          endTime,
          familyId: orgId,
          notes: notes || null,
          startTime,
          type: 'sleep',
          userId,
        })
        .returning();

      revalidatePath('/app');
      return activity;
    },
  );

/**
 * Get parent's recent sleep data
 */
export const getParentSleepDataAction = action
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput: { userId } }) => {
    // Get the last 24 hours
    const twentyFourHoursAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);

    // Get all sleep activities for this user in the last 24 hours
    const sleepActivities = await db.query.Activities.findMany({
      orderBy: (activities, { desc }) => [desc(activities.startTime)],
      where: and(
        eq(Activities.userId, userId),
        eq(Activities.type, 'sleep'),
        gte(Activities.startTime, twentyFourHoursAgo),
      ),
    });

    // Calculate total sleep in last 24h
    const totalSleepLast24h = sleepActivities.reduce(
      (sum, activity) => sum + (activity.duration || 0),
      0,
    );

    // Get the most recent sleep session
    const lastSleep = sleepActivities[0]
      ? {
          duration: sleepActivities[0].duration || 0,
          endTime: sleepActivities[0].endTime,
          startTime: sleepActivities[0].startTime,
        }
      : null;

    return {
      lastSleep,
      totalSleepLast24h,
    };
  });

/**
 * Quick log parent sleep (simplified version for quick entry)
 */
export const quickLogParentSleepAction = action
  .schema(
    z.object({
      durationHours: z.number().min(0.5).max(24),
      userId: z.string(),
    }),
  )
  .action(async ({ parsedInput: { userId, durationHours } }) => {
    const api = await getApi();
    const authResult = await auth();

    if (!authResult?.orgId) {
      throw new Error('Authentication required');
    }

    const { orgId } = authResult;

    // Get primary baby (required for activities table)
    const babies = await api.babies.list();
    const primaryBaby = babies[0];

    if (!primaryBaby) {
      throw new Error('No baby found');
    }

    const durationSeconds = Math.floor(durationHours * 3600);
    const endTime = new Date();
    const startTime = new Date(endTime.getTime() - durationSeconds * 1000);

    // Create sleep activity for the parent
    const [activity] = await db
      .insert(Activities)
      .values({
        babyId: primaryBaby.id,
        details: {
          sleepType: 'night',
          type: 'sleep',
        },
        duration: durationSeconds,
        endTime,
        familyId: orgId,
        startTime,
        type: 'sleep',
        userId,
      })
      .returning();

    revalidatePath('/app');
    return activity;
  });
