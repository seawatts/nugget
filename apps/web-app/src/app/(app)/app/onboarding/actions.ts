'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createOrg } from '@nugget/api/services';
import { db } from '@nugget/db/client';
import {
  Babies,
  Families,
  FamilyMembers,
  SupplyInventory,
} from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

// Check if user has completed onboarding
export const checkOnboarding = action.action(async () => {
  const { userId, orgId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  if (!orgId) {
    // No family yet, onboarding not completed
    return {
      completed: false,
      journeyStage: null,
      ttcMethod: null,
      userRole: null,
    };
  }

  const familyMember = await db.query.FamilyMembers.findFirst({
    where: eq(FamilyMembers.userId, userId),
  });

  return {
    completed: Boolean(familyMember?.onboardingCompletedAt),
    journeyStage: familyMember?.journeyStage,
    ttcMethod: familyMember?.ttcMethod,
    userRole: familyMember?.userRole,
  };
});

// Complete onboarding action
const completeOnboardingSchema = z.object({
  babyName: z.string().optional(),
  birthDate: z.string().optional(),
  dueDate: z.string().optional(),
  journeyStage: z.enum(['ttc', 'pregnant', 'born']),
  lastPeriodDate: z.string().optional(),
  ttcMethod: z.enum(['natural', 'ivf', 'other']).optional(),
  userRole: z.enum(['primary', 'partner']),
});

export const completeOnboardingAction = action
  .inputSchema(completeOnboardingSchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // Auto-create family if it doesn't exist
    let familyId = orgId;

    if (!familyId) {
      // Check if user already has a family in the database
      const existingFamilyMember = await db.query.FamilyMembers.findFirst({
        where: eq(FamilyMembers.userId, userId),
        with: {
          family: true,
        },
      });

      if (existingFamilyMember?.family) {
        familyId = existingFamilyMember.family.id;
      } else {
        // Auto-create a family for the user
        const client = await clerkClient();
        const user = await client.users.getUser(userId);

        // Generate family name: use baby name if provided (born stage), otherwise use user's first name
        const familyName = parsedInput.babyName
          ? `${parsedInput.babyName}'s Family`
          : `${user.firstName || 'My'}'s Family`;

        // Create the organization
        const orgResult = await createOrg({
          name: familyName,
          userId,
        });

        familyId = orgResult.org.id;

        // Set the new organization as active in Clerk
        await client.users.updateUser(userId, {
          publicMetadata: {
            ...user.publicMetadata,
            activeOrgId: familyId,
          },
        });
      }
    }

    return await db.transaction(async (tx) => {
      // 1. Get or find family
      let family = null;

      if (familyId) {
        // Fetch existing family
        family = await tx.query.Families.findFirst({
          where: eq(Families.id, familyId),
        });
      }

      if (!family) {
        throw new Error('Failed to create or find family. Please try again.');
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
            journeyStage: parsedInput.journeyStage,
            onboardingCompletedAt: new Date(),
            ttcMethod: parsedInput.ttcMethod || null,
            updatedAt: new Date(),
            userRole: parsedInput.userRole,
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
            journeyStage: parsedInput.journeyStage,
            onboardingCompletedAt: new Date(),
            ttcMethod: parsedInput.ttcMethod || null,
            userId,
            userRole: parsedInput.userRole,
          })
          .returning();
        familyMember = created;
      }

      if (!familyMember) {
        throw new Error('Failed to update family member');
      }

      // 3. For "born" stage, create baby record
      let baby = null;
      if (parsedInput.journeyStage === 'born' && parsedInput.birthDate) {
        const [createdBaby] = await tx
          .insert(Babies)
          .values({
            birthDate: new Date(parsedInput.birthDate),
            familyId: family.id,
            name: parsedInput.babyName || 'Baby',
            userId,
          })
          .returning();

        if (!createdBaby) {
          throw new Error('Failed to create baby');
        }

        baby = createdBaby;

        // 4. Create initial supply inventory for the baby
        await tx.insert(SupplyInventory).values({
          babyId: baby.id,
          donorMl: 0,
          formulaMl: 0,
          pumpedMl: 0,
          userId,
        });
      }

      // Revalidate paths
      revalidatePath('/app');
      revalidatePath('/app/onboarding');

      return {
        baby,
        family,
        familyMember,
        success: true,
      };
    });
  });
