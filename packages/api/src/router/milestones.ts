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
});
