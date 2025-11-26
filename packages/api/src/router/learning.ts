import { generateDailyLearning } from '@nugget/ai';
import { DbCache } from '@nugget/content-rules/db-cache-adapter';
import { Babies } from '@nugget/db/schema';
import { differenceInDays, differenceInWeeks, format } from 'date-fns';
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

        // Generate cache key: learning:babyId:day{ageInDays}:YYYY-MM-DD
        const dateKey = format(new Date(), 'yyyy-MM-dd');
        const cacheKey = `learning:${input.babyId}:day${ageInDays}:${dateKey}`;

        // Initialize cache
        const cache = new DbCache(
          ctx.db,
          input.babyId,
          ctx.auth.orgId,
          ctx.auth.userId,
        );

        try {
          // Check cache first
          const cached = await cache.get(cacheKey);

          if (cached && cached.exp > Date.now()) {
            const val = cached.val as Record<string, unknown>;

            // Skip pending states - don't try to regenerate while generating
            if (val?._status === 'pending') {
              const pendingAge = Date.now() - ((val._timestamp as number) || 0);
              console.log(
                `[Learning Cache] Entry is pending generation (${Math.round(pendingAge / 1000)}s ago)`,
              );
              // Return empty state while pending
              return {
                status: 'pending',
                tips: [],
              };
            }

            // For error states, log the error and regenerate
            if (val?._status === 'error') {
              console.error('[Learning Cache] Cached error found:', val._error);
              console.log('[Learning Cache] Will regenerate after error');
              // Fall through to generation
            } else {
              // Valid cached content
              console.log('[Learning Cache] Cache hit, returning immediately');
              const cachedTips = val.tips as LearningTip[];
              return {
                status: cachedTips.length > 0 ? 'ready' : 'empty',
                tips: cachedTips,
              };
            }
          }

          // Cache miss or error - generate new content
          console.log('[Learning Cache] Cache miss, generating new content...');
          const startTime = Date.now();

          // Set pending marker
          await cache.set(
            cacheKey,
            { _status: 'pending', _timestamp: Date.now() },
            300000, // 5 min pending TTL
          );

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

          const endTime = Date.now();
          console.log(
            `[Learning Cache] Generation took ${endTime - startTime}ms`,
          );

          // Cache the result with 1-day TTL
          await cache.set(cacheKey, { tips }, 86400000); // 1 day

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

          // Mark as error with short TTL so we can retry
          await cache.set(
            cacheKey,
            {
              _error: String(error),
              _status: 'error',
              _timestamp: Date.now(),
            },
            60000, // 1 minute TTL for errors
          );

          // Return empty state - carousel will show "Check back later" message
          return {
            status: 'empty',
            tips: [],
          };
        }
      },
    ),
});
