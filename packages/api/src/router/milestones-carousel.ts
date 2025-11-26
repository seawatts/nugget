import { DbCache } from '@nugget/content-rules/db-cache-adapter';
import { Babies } from '@nugget/db/schema';
import { differenceInDays, format } from 'date-fns';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export type MilestoneCarouselCardData = {
  id: string;
  title: string;
  type: 'physical' | 'cognitive' | 'social' | 'language' | 'self_care';
  ageLabel: string;
  isCompleted: boolean;
  bulletPoints: string[];
  followUpQuestion: string;
  summary?: string;
  description?: string;
  isYesNoQuestion?: boolean;
  openChatOnYes?: boolean;
  openChatOnNo?: boolean;
  milestoneId?: string;
  suggestedDay?: number | null;
};

export const milestonesCarouselRouter = createTRPCRouter({
  /**
   * Get milestones carousel content for a baby
   * Returns milestones for display in the carousel
   * TODO: Re-implement AI generation with correct API signature
   */
  getCarouselContent: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(
      async ({
        ctx,
        input,
      }): Promise<{
        milestones: MilestoneCarouselCardData[];
      }> => {
        if (!ctx.auth.userId || !ctx.auth.orgId) {
          return { milestones: [] };
        }

        // Get baby data
        const baby = await ctx.db.query.Babies.findFirst({
          where: eq(Babies.id, input.babyId),
        });

        if (!baby || !baby.birthDate) {
          return { milestones: [] };
        }

        const ageInDays = differenceInDays(new Date(), baby.birthDate);

        // Generate cache key: milestones:babyId:day{ageInDays}:YYYY-MM-DD
        const dateKey = format(new Date(), 'yyyy-MM-dd');
        const cacheKey = `milestones:${input.babyId}:day${ageInDays}:${dateKey}`;

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
                `[Milestones Cache] Entry is pending generation (${Math.round(pendingAge / 1000)}s ago)`,
              );
              // Return empty array while pending
              return { milestones: [] };
            }

            // For error states, log the error and regenerate
            if (val?._status === 'error') {
              console.error(
                '[Milestones Cache] Cached error found:',
                val._error,
              );
              console.log('[Milestones Cache] Will regenerate after error');
              // Fall through to generation
            } else {
              // Valid cached content
              console.log(
                '[Milestones Cache] Cache hit, returning immediately',
              );
              const cachedMilestones =
                val.milestones as MilestoneCarouselCardData[];
              return { milestones: cachedMilestones };
            }
          }

          // Cache miss or error - generate new content
          console.log(
            '[Milestones Cache] Cache miss, generating new content...',
          );
          const startTime = Date.now();

          // Set pending marker
          await cache.set(
            cacheKey,
            { _status: 'pending', _timestamp: Date.now() },
            300000, // 5 min pending TTL
          );

          // TODO: Implement milestone generation
          // For now, return empty array to avoid breaking the UI
          // The milestone carousel will show the "Coming soon" state
          // When implementing, use generateMilestoneSuggestions from @nugget/ai
          const milestones: MilestoneCarouselCardData[] = [];

          const endTime = Date.now();
          console.log(
            `[Milestones Cache] Generation took ${endTime - startTime}ms`,
          );

          // Cache the result with 1-day TTL
          await cache.set(cacheKey, { milestones }, 86400000); // 1 day

          return { milestones };
        } catch (error) {
          // Log error but don't crash the dashboard
          console.error('Failed to generate milestone content:', {
            ageInDays,
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

          // Return empty array - carousel will show "Coming soon" message
          return { milestones: [] };
        }
      },
    ),
});
