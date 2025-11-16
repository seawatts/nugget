'use server';

import { auth } from '@clerk/nextjs/server';
import { getApi } from '@nugget/api/server';
import type { Activities } from '@nugget/db/schema';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

const updateActivityInputSchema = z.object({
  amount: z.number().optional(),
  details: z.any().optional(),
  duration: z.number().optional(),
  endTime: z.date().optional(),
  feedingSource: z.enum(['direct', 'pumped', 'formula', 'donor']).optional(),
  id: z.string(),
  notes: z.string().optional(),
  startTime: z.date().optional(),
  type: z
    .enum([
      'sleep',
      'feeding',
      'bottle',
      'nursing',
      'pumping',
      'diaper',
      'wet',
      'dirty',
      'both',
      'solids',
      'bath',
      'medicine',
      'temperature',
      'tummy_time',
      'growth',
      'potty',
    ])
    .optional(),
});

/**
 * Update an existing activity with optimistic support
 */
export const updateActivityAction = action
  .schema(updateActivityInputSchema)
  .action(
    async ({
      parsedInput,
    }): Promise<{ activity: typeof Activities.$inferSelect }> => {
      // Verify authentication
      const authResult = await auth();
      if (!authResult.userId) {
        throw new Error('Authentication required');
      }

      // Create tRPC API helper
      const api = await getApi();

      const { id, ...updateData } = parsedInput;

      // Update the activity
      const activity = await api.activities.update.fetch({
        id,
        ...updateData,
      });

      // Revalidate any pages that might display activities
      revalidatePath('/app');
      revalidatePath('/app/timeline');
      revalidatePath('/app/activities');

      return { activity };
    },
  );
