'use server';

import { getApi } from '@nugget/api/server';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

const action = createSafeActionClient();

export interface EntityInfo {
  type: 'baby' | 'user';
  id: string;
  firstName: string;
  avatarUrl: string | null;
  avatarBackgroundColor?: string | null;
}

/**
 * Determine if a userId is a baby or a family member
 */
export const getEntityInfoAction = action
  .schema(z.object({ userId: z.string() }))
  .action(async ({ parsedInput: { userId } }) => {
    const api = await getApi();

    // Check if it's a baby (baby IDs start with 'baby_')
    if (userId.startsWith('baby_')) {
      try {
        const baby = await api.babies.getById({ id: userId });
        if (baby) {
          return {
            avatarBackgroundColor: baby.avatarBackgroundColor,
            avatarUrl: baby.photoUrl,
            firstName: baby.firstName,
            id: baby.id,
            type: 'baby' as const,
          };
        }
      } catch {
        // Baby not found, continue to check if it's a user
      }
    }

    // Check if it's a user
    try {
      const user = await api.user.byId({ id: userId });
      if (user) {
        return {
          avatarUrl: user.avatarUrl,
          firstName: user.firstName || user.email || 'Unknown',
          id: user.id,
          type: 'user' as const,
        };
      }
    } catch {
      // User not found
    }

    return null;
  });
