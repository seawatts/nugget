import {
  Babies,
  DevelopmentalPhaseProgress,
  DevelopmentalPhases,
} from '@nugget/db/schema';
import { differenceInDays } from 'date-fns';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

const subPhaseEnum = z.enum(['fussy', 'skills']);

export const developmentalPhasesRouter = createTRPCRouter({
  getPhasesForBaby: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId || !ctx.auth.userId) {
        return {
          ageInDays: 0,
          babyId: input.babyId,
          phases: [],
          progress: [],
        };
      }

      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby || !baby.birthDate) {
        return {
          ageInDays: 0,
          babyId: input.babyId,
          phases: [],
          progress: [],
        };
      }

      const ageInDays = differenceInDays(new Date(), baby.birthDate);

      const phases = await ctx.db.query.DevelopmentalPhases.findMany({
        orderBy: (fields, { asc }) => [asc(fields.phaseNumber)],
      });

      const progress = await ctx.db
        .select()
        .from(DevelopmentalPhaseProgress)
        .where(eq(DevelopmentalPhaseProgress.babyId, input.babyId));

      return {
        ageInDays,
        babyId: input.babyId,
        phases,
        progress,
      };
    }),

  updatePhaseProgress: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        checklistItems: z.array(z.string()),
        isSubPhaseComplete: z.boolean().optional(),
        phaseId: z.string(),
        subPhaseType: subPhaseEnum,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId || !ctx.auth.userId) {
        throw new Error('Authentication required');
      }

      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      const phase = await ctx.db.query.DevelopmentalPhases.findFirst({
        where: eq(DevelopmentalPhases.id, input.phaseId),
      });

      if (!phase) {
        throw new Error('Developmental phase not found');
      }

      const [existing] = await ctx.db
        .select()
        .from(DevelopmentalPhaseProgress)
        .where(
          and(
            eq(DevelopmentalPhaseProgress.babyId, input.babyId),
            eq(DevelopmentalPhaseProgress.phaseId, input.phaseId),
            eq(DevelopmentalPhaseProgress.subPhaseType, input.subPhaseType),
          ),
        );

      const uniqueChecklistItems = Array.from(new Set(input.checklistItems));
      const isComplete = input.isSubPhaseComplete ?? false;
      const completedAt = isComplete
        ? (existing?.completedAt ?? new Date())
        : null;

      if (existing) {
        const [updated] = await ctx.db
          .update(DevelopmentalPhaseProgress)
          .set({
            checklistItems: uniqueChecklistItems,
            completedAt,
            updatedAt: new Date(),
          })
          .where(eq(DevelopmentalPhaseProgress.id, existing.id))
          .returning();

        return updated;
      }

      const [created] = await ctx.db
        .insert(DevelopmentalPhaseProgress)
        .values({
          babyId: input.babyId,
          checklistItems: uniqueChecklistItems,
          completedAt,
          familyId: ctx.auth.orgId,
          phaseId: input.phaseId,
          subPhaseType: input.subPhaseType,
          userId: ctx.auth.userId,
        })
        .returning();

      return created;
    }),
});
