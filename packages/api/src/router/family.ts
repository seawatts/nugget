import { Families, FamilyMembers } from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { z } from 'zod';
import { createOrg } from '../services';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const familyRouter = createTRPCRouter({
  checkNameAvailability: protectedProcedure
    .input(
      z.object({
        excludeOrgId: z.string().optional(),
        name: z.string(),
      }),
    )
    .query(async ({ ctx, input }) => {
      // First check if the user already has access to a family with this name
      const existingOrgWithAccess = await ctx.db.query.Families.findFirst({
        where: eq(Families.name, input.name),
        with: {
          familyMembers: {
            where: eq(FamilyMembers.userId, ctx.auth.userId),
          },
        },
      });

      // If user has access to an org with this name, it's available to them
      if (
        existingOrgWithAccess &&
        existingOrgWithAccess.familyMembers.length > 0
      ) {
        return {
          available: true,
          message: `You already have access to organization '${input.name}'`,
        };
      }

      const existingOrg = await ctx.db.query.Families.findFirst({
        where: eq(Families.name, input.name),
      });

      const isAvailable =
        !existingOrg ||
        (input.excludeOrgId && existingOrg.id === input.excludeOrgId);

      return {
        available: Boolean(isAvailable),
        message: isAvailable
          ? `Organization name '${input.name}' is available`
          : `Organization name '${input.name}' already exists`,
      };
    }),
  current: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');
    return ctx.db.query.Families.findFirst({
      where: eq(Families.id, ctx.auth.orgId),
    });
  }),

  // Delete an organization and all associated data
  delete: protectedProcedure.mutation(async ({ ctx }) => {
    if (!ctx.auth.orgId) throw new Error('Organization ID is required');

    // Verify the org exists and user has access to it
    const org = await ctx.db.query.Families.findFirst({
      where: eq(Families.id, ctx.auth.orgId),
      with: {
        familyMembers: {
          where: eq(FamilyMembers.userId, ctx.auth.userId),
        },
      },
    });

    if (!org) {
      throw new Error('Organization not found');
    }

    if (org.familyMembers.length === 0) {
      throw new Error('You do not have permission to delete this organization');
    }

    // Delete the organization (cascades to babies, activities, supply transactions, etc.)
    const [deletedOrg] = await ctx.db
      .delete(Families)
      .where(eq(Families.id, ctx.auth.orgId))
      .returning();

    if (!deletedOrg) {
      throw new Error('Failed to delete organization');
    }

    return { success: true };
  }),

  updateName: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(3)
          .max(50)
          .regex(
            /^[a-z0-9-]+$/,
            'Name can only contain lowercase letters, numbers, and hyphens',
          ),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.orgId) throw new Error('Organization ID is required');

      // Check if family name already exists
      const existingOrg = await ctx.db.query.Families.findFirst({
        where: eq(Families.name, input.name),
      });

      if (existingOrg && existingOrg.id !== ctx.auth.orgId) {
        throw new Error(`Organization name '${input.name}' already exists`);
      }

      const [updatedOrg] = await ctx.db
        .update(Families)
        .set({
          name: input.name,
          updatedAt: new Date(),
        })
        .where(eq(Families.id, ctx.auth.orgId))
        .returning();

      return updatedOrg;
    }),

  // Create a new organization with Stripe integration
  upsert: protectedProcedure
    .input(
      z.object({
        name: z
          .string()
          .min(3, 'Organization name must be at least 3 characters'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      if (!ctx.auth.userId) {
        throw new Error('User ID is required');
      }

      try {
        const existingOrg = await ctx.db.query.Families.findFirst({
          where: eq(Families.name, input.name),
        });

        if (existingOrg) {
          return {
            org: {
              id: existingOrg.id,
              name: existingOrg.name,
              stripeCustomerId: existingOrg.stripeCustomerId,
            },
          };
        }
      } catch (error) {
        console.error('Failed to check organization name:', error);
        throw new Error('Failed to check organization name');
      }

      try {
        const result = await createOrg({
          name: input.name,
          userId: ctx.auth.userId,
        });

        return result;
      } catch (error) {
        console.error('Failed to create organization:', error);
        throw new Error(
          error instanceof Error
            ? error.message
            : 'Failed to create organization',
        );
      }
    }),
});
