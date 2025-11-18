import { and, desc, eq } from '@nugget/db';
import { Babies, Milestones } from '@nugget/db/schema';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const milestonesRouter = createTRPCRouter({
  // List milestones for a baby
  list: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        limit: z.number().min(1).max(100).default(100),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      const { babyId, limit } = input;

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(eq(Babies.id, babyId), eq(Babies.familyId, ctx.auth.orgId)),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      return ctx.db.query.Milestones.findMany({
        limit,
        orderBy: [desc(Milestones.achievedDate)],
        where: eq(Milestones.babyId, babyId),
      });
    }),

  // Mark a milestone as complete
  markComplete: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        description: z.string(),
        suggestedDay: z.number(),
        title: z.string(),
        type: z.enum([
          'physical',
          'cognitive',
          'social',
          'language',
          'self_care',
        ]),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      if (!ctx.auth.userId) {
        throw new Error('Authentication required');
      }

      const { babyId, title, description, type, suggestedDay } = input;

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(eq(Babies.id, babyId), eq(Babies.familyId, ctx.auth.orgId)),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      // Check if milestone already exists
      const existingMilestone = await ctx.db.query.Milestones.findFirst({
        where: and(
          eq(Milestones.babyId, babyId),
          eq(Milestones.title, title),
          eq(Milestones.isSuggested, true),
        ),
      });

      let milestone: typeof existingMilestone;

      if (existingMilestone) {
        // Update existing milestone
        const [updated] = await ctx.db
          .update(Milestones)
          .set({
            achievedDate: new Date(),
            description,
            updatedAt: new Date(),
          })
          .where(eq(Milestones.id, existingMilestone.id))
          .returning();
        milestone = updated;
      } else {
        // Create new milestone
        const [created] = await ctx.db
          .insert(Milestones)
          .values({
            achievedDate: new Date(),
            babyId,
            description,
            familyId: ctx.auth.orgId,
            isSuggested: true,
            suggestedDay,
            title,
            type,
            userId: ctx.auth.userId,
          })
          .returning();
        milestone = created;
      }

      if (!milestone) {
        throw new Error('Failed to create or update milestone');
      }

      return milestone;
    }),
});
