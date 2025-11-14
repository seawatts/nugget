import {
  Babies,
  FeedingSourceType,
  insertSupplyTransactionSchema,
  SupplyInventory,
  SupplyTransactions,
  SupplyTransactionTypeType,
} from '@nugget/db/schema';
import { and, desc, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const supplyTransactionsRouter = createTRPCRouter({
  // Create a new supply transaction and update inventory
  create: protectedProcedure
    .input(
      insertSupplyTransactionSchema
        .omit({
          createdAt: true,
          id: true,
          timestamp: true,
          updatedAt: true,
          userId: true,
        })
        .extend({
          babyId: z.string(),
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

      // Get or create supply inventory
      let inventory = await ctx.db.query.SupplyInventory.findFirst({
        where: eq(SupplyInventory.babyId, input.babyId),
      });

      if (!inventory) {
        const [newInventory] = await ctx.db
          .insert(SupplyInventory)
          .values({
            babyId: input.babyId,
            donorMl: 0,
            formulaMl: 0,
            pumpedMl: 0,
            userId: ctx.auth.userId,
          })
          .returning();

        if (!newInventory) {
          throw new Error('Failed to create supply inventory');
        }

        inventory = newInventory;
      }

      // Create the transaction
      const [transaction] = await ctx.db
        .insert(SupplyTransactions)
        .values({
          ...input,
          timestamp: new Date(),
          userId: ctx.auth.userId,
        })
        .returning();

      if (!transaction) {
        throw new Error('Failed to create supply transaction');
      }

      // Update inventory based on transaction
      const multiplier = input.type === 'add' ? 1 : -1;
      const amount = input.amountMl * multiplier;

      const updates: Partial<typeof SupplyInventory.$inferInsert> = {};

      switch (input.source) {
        case 'pumped':
          updates.pumpedMl = Math.max(0, inventory.pumpedMl + amount);
          break;
        case 'donor':
          updates.donorMl = Math.max(0, inventory.donorMl + amount);
          break;
        case 'formula':
          updates.formulaMl = Math.max(0, inventory.formulaMl + amount);
          break;
      }

      const [updatedInventory] = await ctx.db
        .update(SupplyInventory)
        .set(updates)
        .where(eq(SupplyInventory.id, inventory.id))
        .returning();

      return {
        inventory: updatedInventory,
        transaction,
      };
    }),

  // Delete a supply transaction
  delete: protectedProcedure
    .input(z.object({ id: z.string() }))
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      // Verify transaction belongs to a baby in the family
      const transaction = await ctx.db.query.SupplyTransactions.findFirst({
        where: eq(SupplyTransactions.id, input.id),
        with: {
          baby: true,
        },
      });

      if (!transaction || transaction.baby.familyId !== ctx.auth.orgId) {
        throw new Error('Supply transaction not found');
      }

      const [deletedTransaction] = await ctx.db
        .delete(SupplyTransactions)
        .where(eq(SupplyTransactions.id, input.id))
        .returning();

      if (!deletedTransaction) {
        throw new Error('Failed to delete supply transaction');
      }

      // Reverse the transaction's effect on inventory
      const inventory = await ctx.db.query.SupplyInventory.findFirst({
        where: eq(SupplyInventory.babyId, transaction.babyId),
      });

      if (inventory) {
        const multiplier = transaction.type === 'add' ? -1 : 1;
        const amount = transaction.amountMl * multiplier;

        const updates: Partial<typeof SupplyInventory.$inferInsert> = {};

        switch (transaction.source) {
          case 'pumped':
            updates.pumpedMl = Math.max(0, inventory.pumpedMl + amount);
            break;
          case 'donor':
            updates.donorMl = Math.max(0, inventory.donorMl + amount);
            break;
          case 'formula':
            updates.formulaMl = Math.max(0, inventory.formulaMl + amount);
            break;
        }

        await ctx.db
          .update(SupplyInventory)
          .set(updates)
          .where(eq(SupplyInventory.id, inventory.id));
      }

      return { success: true };
    }),
  // List supply transactions for a baby
  list: protectedProcedure
    .input(
      z.object({
        babyId: z.string(),
        limit: z.number().min(1).max(100).default(50),
        source: z
          .enum(Object.keys(FeedingSourceType) as [string, ...string[]])
          .optional(),
        type: z
          .enum(Object.keys(SupplyTransactionTypeType) as [string, ...string[]])
          .optional(),
      }),
    )
    .query(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) {
        throw new Error('Family ID is required');
      }

      const { babyId, limit, source, type } = input;

      // Verify baby belongs to family
      const baby = await ctx.db.query.Babies.findFirst({
        where: and(eq(Babies.id, babyId), eq(Babies.familyId, ctx.auth.orgId)),
      });

      if (!baby) {
        throw new Error('Baby not found');
      }

      const conditions = [eq(SupplyTransactions.babyId, babyId)];
      if (source) {
        conditions.push(
          eq(
            SupplyTransactions.source,
            source as (typeof FeedingSourceType)[keyof typeof FeedingSourceType],
          ),
        );
      }
      if (type) {
        conditions.push(
          eq(
            SupplyTransactions.type,
            type as (typeof SupplyTransactionTypeType)[keyof typeof SupplyTransactionTypeType],
          ),
        );
      }

      return ctx.db.query.SupplyTransactions.findMany({
        limit,
        orderBy: [desc(SupplyTransactions.timestamp)],
        where: and(...conditions),
        with: {
          user: true,
        },
      });
    }),
});
