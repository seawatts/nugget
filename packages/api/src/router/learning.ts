import { generateDailyLearning } from '@nugget/ai';
import { Babies } from '@nugget/db/schema';
import { differenceInDays, differenceInWeeks } from 'date-fns';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export interface LearningTip {
  category: string;
  subtitle: string;
  summary: string;
  bulletPoints: string[];
  followUpQuestion?: string | null; // Optional since BAML may fail to provide it
  isYesNoQuestion?: boolean;
  openChatOnYes?: boolean;
  openChatOnNo?: boolean;
}

export const learningRouter = createTRPCRouter({
  /**
   * Get learning carousel content for a baby
   * Uses cache-first loading with 1-day TTL
   */
  getCarouselContent: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(
      async ({
        ctx,
        input,
      }): Promise<{
        tips: LearningTip[];
        status: 'loading' | 'pending' | 'ready' | 'empty';
      }> => {
        if (!ctx.auth.userId || !ctx.auth.orgId) {
          return { status: 'empty', tips: [] };
        }

        // Get baby data
        const baby = await ctx.db.query.Babies.findFirst({
          where: eq(Babies.id, input.babyId),
        });

        if (!baby || !baby.birthDate) {
          return { status: 'empty', tips: [] };
        }

        const ageInDays = differenceInDays(new Date(), baby.birthDate);
        const ageInWeeks = differenceInWeeks(new Date(), baby.birthDate);

        try {
          // Call AI orchestrator with retry logic built-in
          const result = await generateDailyLearning({
            achievedMilestones: null,
            activitySummary: null,
            ageInDays,
            ageInWeeks,
            avgDiaperChangesPerDay: null,
            avgFeedingInterval: null,
            avgFeedingsPerDay: null,
            avgSleepHoursPerDay: null,
            babyName: baby.firstName ?? 'Baby',
            babySex: baby.gender ?? null,
            birthWeightOz: baby.birthWeightOz ?? null,
            currentWeightOz: baby.currentWeightOz ?? null,
            diaperCount24h: null,
            feedingCount24h: null,
            firstTimeParent: false,
            height: null,
            medicalContext: null,
            parentWellness: null,
            recentChatTopics: null,
            recentlyCoveredTopics: null,
            sleepCount24h: null,
            totalSleepHours24h: null,
          });

          const tips = result.tips.map((tip) => ({
            ...tip,
            followUpQuestion: tip.followUpQuestion ?? undefined,
            isYesNoQuestion: tip.isYesNoQuestion ?? undefined,
            openChatOnNo: tip.openChatOnNo ?? undefined,
            openChatOnYes: tip.openChatOnYes ?? undefined,
          }));

          return {
            status: tips.length > 0 ? 'ready' : 'empty',
            tips,
          };
        } catch (error) {
          // Log error but don't crash the dashboard
          console.error('Failed to generate learning content:', {
            ageInDays,
            ageInWeeks,
            babyId: input.babyId,
            error: error instanceof Error ? error.message : String(error),
          });

          // Return empty state - carousel will show "Check back later" message
          return {
            status: 'empty',
            tips: [],
          };
        }
      },
    ),
});
