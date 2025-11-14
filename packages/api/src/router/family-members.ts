import { clerkClient } from '@clerk/nextjs/server';
import { Families, FamilyMembers } from '@nugget/db/schema';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const familyMembersRouter = createTRPCRouter({
  all: protectedProcedure.query(async ({ ctx }) => {
    const { orgId: familyId } = ctx.auth;

    if (!familyId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be part of a family to view members',
      });
    }

    // Fetch all family members for the current family, including user info
    const members = await ctx.db.query.FamilyMembers.findMany({
      where: eq(FamilyMembers.familyId, familyId),
      with: { user: true },
    });

    return members;
  }),

  // Remove a member from the family
  remove: protectedProcedure
    .input(
      z.object({
        userId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId: currentUserId, orgId: familyId } = ctx.auth;

      if (!familyId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be part of a family to remove members',
        });
      }

      // Can't remove yourself
      if (input.userId === currentUserId) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'You cannot remove yourself from the family',
        });
      }

      // Verify the current user has permission (is a member)
      const currentUserMember = await ctx.db.query.FamilyMembers.findFirst({
        where: and(
          eq(FamilyMembers.userId, currentUserId),
          eq(FamilyMembers.familyId, familyId),
        ),
      });

      if (!currentUserMember) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to remove members',
        });
      }

      // Verify the target user is a member
      const targetMember = await ctx.db.query.FamilyMembers.findFirst({
        where: and(
          eq(FamilyMembers.userId, input.userId),
          eq(FamilyMembers.familyId, familyId),
        ),
      });

      if (!targetMember) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Member not found in this family',
        });
      }

      // Remove from database
      await ctx.db
        .delete(FamilyMembers)
        .where(
          and(
            eq(FamilyMembers.userId, input.userId),
            eq(FamilyMembers.familyId, familyId),
          ),
        );

      // Remove from Clerk organization
      try {
        const family = await ctx.db.query.Families.findFirst({
          where: eq(Families.id, familyId),
        });

        if (family) {
          const client = await clerkClient();
          const memberships =
            await client.organizations.getOrganizationMembershipList({
              organizationId: family.clerkOrgId,
            });

          const membership = memberships.data.find(
            (m) => m.publicUserData?.userId === input.userId,
          );

          if (membership) {
            await client.organizations.deleteOrganizationMembership({
              organizationId: family.clerkOrgId,
              userId: input.userId,
            });
          }
        }
      } catch (error) {
        console.error('Failed to remove user from Clerk organization:', error);
        // Don't throw - the database record is removed, Clerk can be synced later
      }

      return { success: true };
    }),
});
