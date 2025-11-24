import { Babies } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';
import {
  type CelebrationCardData,
  type CelebrationCarouselData,
  getCelebrationAIContent,
  getCelebrationContent,
} from '../utils/celebrations';

// Re-export types for use in components
export type { CelebrationCardData, CelebrationCarouselData };

export const celebrationsRouter = createTRPCRouter({
  /**
   * Get AI-enhanced celebration content
   * Generates personalized content using AI based on baby context
   */
  getAIContent: protectedProcedure
    .input(
      z.object({
        ageInDays: z.number(),
        ageLabel: z.string(),
        babyId: z.string(),
        babyName: z.string(),
        birthDate: z.string(),
        celebrationMemoryId: z.string(),
        celebrationTitle: z.string(),
        celebrationType: z.string(),
        gender: z.string().optional(),
        statistics: z.object({
          ageInDays: z.number(),
          ageLabel: z.string(),
          diaperCount: z.number().optional(),
          feedingCount: z.number().optional(),
          sleepHours: z.number().optional(),
        }),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new Error('Unauthorized');
      }

      // Use the shared AI generation logic
      return getCelebrationAIContent(input);
    }),
  /**
   * Get celebration content for a baby
   * Includes complex rule evaluation, stats calculation, and caching
   */
  getCarouselContent: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }): Promise<CelebrationCarouselData> => {
      if (!ctx.auth.userId) {
        return { ageInDays: 0, baby: null, babyName: '', celebration: null };
      }

      // Get the baby
      const baby = await ctx.db.query.Babies.findFirst({
        where: eq(Babies.id, input.babyId),
      });

      if (!baby || !baby.birthDate) {
        return { ageInDays: 0, baby: null, babyName: '', celebration: null };
      }

      // Use the shared celebration logic
      return getCelebrationContent(input.babyId, ctx.auth.userId, baby);
    }),
});
