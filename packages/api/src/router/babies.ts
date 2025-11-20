import {
  Activities,
  Babies,
  insertBabySchema,
  SupplyInventory,
  updateBabySchema,
} from '@nugget/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const babiesRouter = createTRPCRouter({
  // Create a new baby
  create: protectedProcedure
    .input(
      insertBabySchema.omit({
        createdAt: true,
        familyId: true,
        id: true,
        updatedAt: true,
        userId: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId || !ctx.auth.userId) {
        throw new Error('Authentication required');
      }

      // Create baby
      const [baby] = await ctx.db
        .insert(Babies)
        .values({
          ...input,
          familyId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      if (!baby) {
        throw new Error('Failed to create baby');
      }

      // Create initial supply inventory
      await ctx.db.insert(SupplyInventory).values({
        babyId: baby.id,
        donorMl: 0,
        familyId: ctx.auth.orgId,
        formulaMl: 0,
        pumpedMl: 0,
        userId: ctx.auth.userId,
      });

      return baby;
    }),

  // Delete a baby
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      const [deletedBaby] = await ctx.db
        .delete(Babies)
        .where(
          and(eq(Babies.id, input.id), eq(Babies.familyId, ctx.auth.orgId)),
        )
        .returning();

      if (!deletedBaby) {
        throw new Error('Baby not found or delete failed');
      }

      return { success: true };
    }),

  // Get a specific baby by ID
  getById: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.id),
          eq(Babies.familyId, ctx.auth.orgId || ''),
        ),
        with: {
          activities: {
            limit: 10,
            orderBy: [desc(Activities.startTime)],
          },
          supplyInventory: true,
        },
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      return baby;
    }),

  // Get a specific baby by ID (lightweight version without nested relations)
  getByIdLight: protectedProcedure
    .input(z.object({ id: z.string() }))
    .query(async ({ ctx, input }) => {
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.id),
          eq(Babies.familyId, ctx.auth.orgId || ''),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      return baby;
    }),

  // Get the most recently updated baby
  getMostRecent: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) {
      throw new Error('Family ID is required');
    }

    const baby = await ctx.db.query.Babies.findFirst({
      orderBy: [desc(Babies.updatedAt)],
      where: eq(Babies.familyId, ctx.auth.orgId),
      with: {
        activities: {
          limit: 10,
          orderBy: [desc(Activities.startTime)],
        },
        supplyInventory: true,
      },
    });

    return baby || null;
  }),
  // List all babies for the current family
  list: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) {
      throw new Error('Family ID is required');
    }

    return ctx.db.query.Babies.findMany({
      orderBy: [desc(Babies.updatedAt)],
      where: eq(Babies.familyId, ctx.auth.orgId),
    });
  }),

  // Update an existing baby
  update: protectedProcedure
    .input(
      updateBabySchema.required({ id: true }).omit({
        createdAt: true,
        familyId: true,
        updatedAt: true,
        userId: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      const { id, ...data } = input;

      const [updatedBaby] = await ctx.db
        .update(Babies)
        .set(data)
        .where(and(eq(Babies.id, id), eq(Babies.familyId, ctx.auth.orgId)))
        .returning();

      if (!updatedBaby) {
        throw new Error('Baby not found or update failed');
      }

      return updatedBaby;
    }),
});
