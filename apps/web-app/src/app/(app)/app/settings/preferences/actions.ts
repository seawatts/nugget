'use server';

import { currentUser } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { Users } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

const updateAlarmPreferencesSchema = z.object({
  alarmDiaperEnabled: z.boolean().optional(),
  alarmDiaperThreshold: z.number().int().positive().nullable().optional(),
  alarmFeedingEnabled: z.boolean().optional(),
  alarmFeedingThreshold: z.number().int().positive().nullable().optional(),
  alarmPumpingEnabled: z.boolean().optional(),
  alarmPumpingThreshold: z.number().int().positive().nullable().optional(),
  alarmSleepEnabled: z.boolean().optional(),
  alarmSleepThreshold: z.number().int().positive().nullable().optional(),
});

export const updateAlarmPreferencesAction = action
  .schema(updateAlarmPreferencesSchema)
  .action(async ({ parsedInput }) => {
    const clerkUser = await currentUser();
    if (!clerkUser) {
      throw new Error('Unauthorized');
    }

    const user = await db.query.Users.findFirst({
      where: eq(Users.clerkId, clerkUser.id),
    });

    if (!user) {
      throw new Error('User not found');
    }

    // Update alarm preferences
    await db
      .update(Users)
      .set({
        ...parsedInput,
        updatedAt: new Date(),
      })
      .where(eq(Users.id, user.id));

    revalidatePath('/app/settings/preferences');

    return { success: true };
  });
