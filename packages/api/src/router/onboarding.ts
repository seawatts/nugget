import { db } from '@nugget/db/client';
import {
  Babies,
  Families,
  FamilyMembers,
  SupplyInventory,
  Users,
} from '@nugget/db/schema';
import { and, eq } from 'drizzle-orm';
import { z } from 'zod';
import { createOrg } from '../services';
import { createTRPCRouter, protectedProcedure } from '../trpc';

export const onboardingRouter = createTRPCRouter({
  // Check if user has completed onboarding
  checkOnboarding: protectedProcedure.query(async ({ ctx }) => {
    if (!ctx.auth.orgId) {
      return {
        completed: false,
        journeyStage: null,
        ttcMethod: null,
        userRole: null,
      };
    }

    // Get the family for the current organization
    const family = await ctx.db.query.Families.findFirst({
      where: eq(Families.clerkOrgId, ctx.auth.orgId),
    });

    if (!family) {
      return {
        completed: false,
        journeyStage: null,
        ttcMethod: null,
        userRole: null,
      };
    }

    // Get the family member record for this user in the current family
    const familyMember = await ctx.db.query.FamilyMembers.findFirst({
      where: and(
        eq(FamilyMembers.userId, ctx.auth.userId),
        eq(FamilyMembers.familyId, family.id),
      ),
    });

    // Get journey stage from the first baby in this family
    const baby = await ctx.db.query.Babies.findFirst({
      where: eq(Babies.familyId, family.id),
    });

    return {
      completed: Boolean(familyMember?.onboardingCompletedAt),
      journeyStage: baby?.journeyStage,
      ttcMethod: baby?.ttcMethod,
      userRole: familyMember?.userRole,
    };
  }),

  // Complete onboarding process
  completeOnboarding: protectedProcedure
    .input(
      z.object({
        babyName: z.string().optional(),
        birthDate: z.string().optional(),
        dueDate: z.string().optional(),
        journeyStage: z.enum(['ttc', 'pregnant', 'born']),
        lastPeriodDate: z.string().optional(),
        ttcMethod: z.enum(['natural', 'ivf', 'other']).optional(),
        userRole: z.enum(['primary', 'partner']),
      }),
    )
    .mutation(async ({ ctx, input }) => {
      const { userId } = ctx.auth;

      return await db.transaction(async (tx) => {
        // 1. Check if user has a family/org from Clerk
        let familyId = ctx.auth.orgId;
        let family = null;

        // If no family exists, try to find or create one
        if (!familyId) {
          // Check if user already has a family in the database
          const existingFamilyMember = await tx.query.FamilyMembers.findFirst({
            where: eq(FamilyMembers.userId, userId),
            with: {
              family: true,
            },
          });

          if (existingFamilyMember?.family) {
            family = existingFamilyMember.family;
            familyId = family.id;
          } else {
            // Create new family using the org creation service
            const user = await tx.query.Users.findFirst({
              where: eq(Users.id, userId),
            });

            if (!user) {
              throw new Error('User not found');
            }

            const userName = [user.firstName, user.lastName]
              .filter(Boolean)
              .join(' ')
              .trim();
            const familyName = userName || user.email.split('@')[0] || 'Family';

            try {
              const result = await createOrg({
                name: `${familyName}'s Family`,
                userId,
              });
              familyId = result.org.id;

              // Fetch the created family
              family = await tx.query.Families.findFirst({
                where: eq(Families.clerkOrgId, familyId),
              });
            } catch (error) {
              console.error('Failed to create family:', error);
              throw new Error(
                'Failed to create family. Please try again or contact support.',
              );
            }
          }
        } else {
          // Fetch existing family
          family = await tx.query.Families.findFirst({
            where: eq(Families.id, familyId),
          });
        }

        if (!family) {
          throw new Error('Failed to get or create family');
        }

        // 2. Update or create family member with onboarding data
        const existingMember = await tx.query.FamilyMembers.findFirst({
          where: eq(FamilyMembers.userId, userId),
        });

        let familyMember: typeof FamilyMembers.$inferSelect | undefined;
        if (existingMember) {
          // Update existing family member
          const [updated] = await tx
            .update(FamilyMembers)
            .set({
              onboardingCompletedAt: new Date(),
              updatedAt: new Date(),
              userRole: input.userRole,
            })
            .where(eq(FamilyMembers.id, existingMember.id))
            .returning();
          familyMember = updated;
        } else {
          // Create new family member
          const [created] = await tx
            .insert(FamilyMembers)
            .values({
              familyId: family.id,
              onboardingCompletedAt: new Date(),
              userId,
              userRole: input.userRole,
            })
            .returning();
          familyMember = created;
        }

        if (!familyMember) {
          throw new Error('Failed to update family member');
        }

        // 3. Create or update baby record for all journey stages
        let baby = null;
        const existingBaby = await tx.query.Babies.findFirst({
          where: eq(Babies.userId, userId),
        });

        const babyValues = {
          birthDate: input.birthDate ? new Date(input.birthDate) : null,
          dueDate: input.dueDate ? new Date(input.dueDate) : null,
          familyId: family.id,
          firstName: input.babyName || 'Baby',
          journeyStage: input.journeyStage,
          ttcMethod: input.ttcMethod || null,
          userId,
        };

        if (existingBaby) {
          // Update existing baby
          const [updatedBaby] = await tx
            .update(Babies)
            .set(babyValues)
            .where(eq(Babies.id, existingBaby.id))
            .returning();
          baby = updatedBaby;
        } else {
          // Create new baby
          const [createdBaby] = await tx
            .insert(Babies)
            .values(babyValues)
            .returning();
          baby = createdBaby;
        }

        if (!baby) {
          throw new Error('Failed to create or update baby');
        }

        // 4. Create initial supply inventory for the baby if it doesn't exist
        const existingInventory = await tx.query.SupplyInventory.findFirst({
          where: eq(SupplyInventory.babyId, baby.id),
        });

        if (!existingInventory) {
          await tx.insert(SupplyInventory).values({
            babyId: baby.id,
            donorMl: 0,
            familyId: family.id,
            formulaMl: 0,
            pumpedMl: 0,
            userId,
          });
        }

        return {
          baby,
          family,
          familyMember,
          success: true,
        };
      });
    }),
});
