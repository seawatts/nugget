'use server';

import { auth } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { Users } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

const updateLastSelectedBabySchema = z.object({
  babyId: z.string(),
  familyId: z.string(),
});

export const updateLastSelectedBabyAction = action
  .inputSchema(updateLastSelectedBabySchema)
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Update user's last selected baby and family
    await db
      .update(Users)
      .set({
        lastSelectedBabyId: parsedInput.babyId,
        lastSelectedFamilyId: parsedInput.familyId,
        updatedAt: new Date(),
      })
      .where(eq(Users.id, userId));

    return {
      success: true,
    };
  });
