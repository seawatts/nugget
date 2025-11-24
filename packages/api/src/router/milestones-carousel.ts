import { Babies } from '@nugget/db/schema';
import { differenceInDays } from 'date-fns';
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

        const _ageInDays = differenceInDays(new Date(), baby.birthDate);

        // TODO: Implement milestone generation
        // For now, return empty array to avoid breaking the UI
        // The milestone carousel will show the "Coming soon" state
        return { milestones: [] };
      },
    ),
});
