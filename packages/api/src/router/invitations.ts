import { clerkClient } from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { FamilyMembers, Invitations } from '@nugget/db/schema';
import { TRPCError } from '@trpc/server';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createTRPCRouter, protectedProcedure, publicProcedure } from '../trpc';

// Helper to generate short invite code (8 characters, URL-safe)
function generateInviteCode(): string {
  const chars = '23456789ABCDEFGHJKLMNPQRSTUVWXYZabcdefghjkmnpqrstuvwxyz';
  let code = '';
  for (let i = 0; i < 8; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

export const invitationsRouter = createTRPCRouter({
  // Accept an invitation
  accept: protectedProcedure
    .input(
      z.object({
        code: z.string().min(8).max(8),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.auth;

      return await db.transaction(async (tx) => {
        // Get invitation with family info
        const invitation = await tx.query.Invitations.findFirst({
          where: eq(Invitations.code, input.code),
          with: {
            family: true,
          },
        });

        if (!invitation) {
          throw new TRPCError({
            code: 'NOT_FOUND',
            message: 'Invitation not found',
          });
        }

        // Check if expired
        const now = new Date();
        if (invitation.expiresAt && new Date(invitation.expiresAt) < now) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This invitation has expired',
          });
        }

        // Check if already used
        if (!invitation.isActive || invitation.usedAt) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'This invitation has already been used',
          });
        }

        // Check if user is already a member
        const existingMember = await tx.query.FamilyMembers.findFirst({
          where: and(
            eq(FamilyMembers.userId, userId),
            eq(FamilyMembers.familyId, invitation.familyId),
          ),
        });

        if (existingMember) {
          throw new TRPCError({
            code: 'BAD_REQUEST',
            message: 'You are already a member of this family',
          });
        }

        // Mark invitation as used
        await tx
          .update(Invitations)
          .set({
            isActive: false,
            updatedAt: new Date(),
            usedAt: now,
            usedByUserId: userId,
          })
          .where(eq(Invitations.id, invitation.id));

        // Create family member record
        const [familyMember] = await tx
          .insert(FamilyMembers)
          .values({
            familyId: invitation.familyId,
            role: invitation.role,
            userId,
          })
          .returning();

        if (!familyMember) {
          throw new TRPCError({
            code: 'INTERNAL_SERVER_ERROR',
            message: 'Failed to create family member',
          });
        }

        // Add user to Clerk organization
        try {
          const client = await clerkClient();

          // Check if user is already a member in Clerk
          const existingClerkMembership = await client.organizations
            .getOrganizationMembershipList({
              organizationId: invitation.family.clerkOrgId,
            })
            .then((list) =>
              list.data.find(
                (membership) => membership.publicUserData?.userId === userId,
              ),
            );

          if (!existingClerkMembership) {
            console.log(
              `Adding user ${userId} to Clerk organization ${invitation.family.clerkOrgId}`,
            );
            await client.organizations.createOrganizationMembership({
              organizationId: invitation.family.clerkOrgId,
              role: invitation.role === 'primary' ? 'admin' : 'basic_member',
              userId,
            });
            console.log(
              `Successfully added user ${userId} to Clerk organization ${invitation.family.clerkOrgId}`,
            );
          } else {
            console.log(
              `User ${userId} is already a member of Clerk organization ${invitation.family.clerkOrgId}`,
            );
          }
        } catch (error) {
          console.error('Failed to add user to Clerk organization:', error);
          // Don't throw - the database record is created, Clerk can be synced later via webhook
          // The frontend will still set the active organization
        }

        return {
          clerkOrgId: invitation.family.clerkOrgId,
          familyId: invitation.familyId,
          familyMember,
          familyName: invitation.family.name,
        };
      });
    }),
  // Create a new invitation
  create: protectedProcedure
    .input(
      z.object({
        role: z.enum(['primary', 'partner', 'caregiver']).default('partner'),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId, orgId: familyId } = ctx.auth;

      if (!familyId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be part of a family to create invitations',
        });
      }

      // Verify user is a member of the family
      const familyMember = await ctx.db.query.FamilyMembers.findFirst({
        where: and(
          eq(FamilyMembers.userId, userId),
          eq(FamilyMembers.familyId, familyId),
        ),
      });

      if (!familyMember) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to create invitations',
        });
      }

      // Generate unique code
      let code = generateInviteCode();
      let attempts = 0;
      while (attempts < 5) {
        const existing = await ctx.db.query.Invitations.findFirst({
          where: eq(Invitations.code, code),
        });
        if (!existing) break;
        code = generateInviteCode();
        attempts++;
      }

      if (attempts === 5) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to generate unique invitation code',
        });
      }

      // Create invitation with 7-day expiry
      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 7);

      const [invitation] = await ctx.db
        .insert(Invitations)
        .values({
          code,
          expiresAt,
          familyId,
          invitedByUserId: userId,
          isActive: true,
          role: input.role,
        })
        .returning();

      if (!invitation) {
        throw new TRPCError({
          code: 'INTERNAL_SERVER_ERROR',
          message: 'Failed to create invitation',
        });
      }

      return invitation;
    }),

  // Get invitation details by code (public - no auth required)
  get: publicProcedure
    .input(
      z.object({
        code: z.string().min(8).max(8),
      }),
    )
    .query(async ({ ctx, input }) => {
      const invitation = await ctx.db.query.Invitations.findFirst({
        where: eq(Invitations.code, input.code),
        with: {
          family: {
            columns: {
              id: true,
              name: true,
            },
          },
          invitedBy: {
            columns: {
              avatarUrl: true,
              firstName: true,
              id: true,
              lastName: true,
            },
          },
        },
      });

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      // Check if expired
      const now = new Date();
      if (invitation.expiresAt && new Date(invitation.expiresAt) < now) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has expired',
        });
      }

      // Check if already used
      if (!invitation.isActive || invitation.usedAt) {
        throw new TRPCError({
          code: 'BAD_REQUEST',
          message: 'This invitation has already been used',
        });
      }

      return invitation;
    }),

  // List invitations for current family
  list: protectedProcedure.query(async ({ ctx }) => {
    const { orgId: familyId } = ctx.auth;

    if (!familyId) {
      throw new TRPCError({
        code: 'UNAUTHORIZED',
        message: 'You must be part of a family to view invitations',
      });
    }

    const invitations = await ctx.db.query.Invitations.findMany({
      where: eq(Invitations.familyId, familyId),
      with: {
        invitedBy: {
          columns: {
            avatarUrl: true,
            email: true,
            firstName: true,
            id: true,
            lastName: true,
          },
        },
        usedBy: {
          columns: {
            avatarUrl: true,
            email: true,
            firstName: true,
            id: true,
            lastName: true,
          },
        },
      },
    });

    return invitations;
  }),

  // Revoke an invitation
  revoke: protectedProcedure
    .input(
      z.object({
        invitationId: z.string(),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId: _userId, orgId: familyId } = ctx.auth;

      if (!familyId) {
        throw new TRPCError({
          code: 'UNAUTHORIZED',
          message: 'You must be part of a family to revoke invitations',
        });
      }

      // Get invitation and verify it belongs to user's family
      const invitation = await ctx.db.query.Invitations.findFirst({
        where: eq(Invitations.id, input.invitationId),
      });

      if (!invitation) {
        throw new TRPCError({
          code: 'NOT_FOUND',
          message: 'Invitation not found',
        });
      }

      if (invitation.familyId !== familyId) {
        throw new TRPCError({
          code: 'FORBIDDEN',
          message: 'You do not have permission to revoke this invitation',
        });
      }

      // Mark as inactive
      await ctx.db
        .update(Invitations)
        .set({
          isActive: false,
          updatedAt: new Date(),
        })
        .where(eq(Invitations.id, input.invitationId));

      return { success: true };
    }),
});
