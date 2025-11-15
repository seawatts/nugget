import {
  Babies,
  insertSupplyInventorySchema,
  SupplyInventory,
  updateSupplyInventorySchema,
} from '@nugget/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const supplyInventoryRouter = createTRPCRouter({
  // Create supply inventory for a baby
  create: protectedProcedure
    .input(
      insertSupplyInventorySchema.omit({
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

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      const [inventory] = await ctx.db
        .insert(SupplyInventory)
        .values({
          ...input,
          familyId: ctx.auth.orgId,
          userId: ctx.auth.userId,
        })
        .returning();

      if (!inventory) {
        throw new Error('Failed to create supply inventory');
      }

      return inventory;
    }),
  // Get supply inventory for a baby
  getByBabyId: protectedProcedure
    .input(z.object({ babyId: z.string() }))
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(
          eq(Babies.id, input.babyId),
          eq(Babies.familyId, ctx.auth.orgId),
        ),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      const inventory = await ctx.db.query.SupplyInventory.findFirst({
        where: eq(SupplyInventory.babyId, input.babyId),
      });

      // If no inventory exists, create one
      if (!inventory && ctx.auth.userId) {
        if (!ctx.auth.orgId) {
          throw new Error('Organization ID is required');
        }
        const [newInventory] = await ctx.db
          .insert(SupplyInventory)
          .values({
            babyId: input.babyId,
            donorMl: 0,
            familyId: ctx.auth.orgId,
            formulaMl: 0,
            pumpedMl: 0,
            userId: ctx.auth.userId,
          })
          .returning();

        if (!newInventory) {
          throw new Error('Failed to create supply inventory');
        }

        return newInventory;
      }

      return inventory;
    }),

  // Update supply inventory
  update: protectedProcedure
    .input(
      updateSupplyInventorySchema.required({ id: true }).omit({
        babyId: true,
        createdAt: true,
        updatedAt: true,
        userId: true,
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      const { id, ...data } = input;

      // Verify inventory belongs to a baby in the family
      const inventory = await ctx.db.query.SupplyInventory.findFirst({
        where: eq(SupplyInventory.id, id),
        with: {
          baby: true,
        },
      });

      if (!inventory || inventory.baby.familyId !== ctx.auth.orgId) {
        throw new Error('Supply inventory not found');
      }

      const [updatedInventory] = await ctx.db
        .update(SupplyInventory)
        .set(data)
        .where(eq(SupplyInventory.id, id))
        .returning();

      if (!updatedInventory) {
        throw new Error('Failed to update supply inventory');
      }

      return updatedInventory;
    }),

  // Update supply levels by baby ID
  updateByBabyId: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        donorMl: z.number().int().min(0).optional(),
        formulaMl: z.number().int().min(0).optional(),
        pumpedMl: z.number().int().min(0).optional(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      const { babyId, ...data } = input;

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(eq(Babies.id, babyId), eq(Babies.familyId, ctx.auth.orgId)),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      const [updatedInventory] = await ctx.db
        .update(SupplyInventory)
        .set(data)
        .where(eq(SupplyInventory.babyId, babyId))
        .returning();

      if (!updatedInventory) {
        throw new Error('Failed to update supply inventory');
      }

      return updatedInventory;
    }),
});
