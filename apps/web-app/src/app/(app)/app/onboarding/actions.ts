'use server';

import { auth, clerkClient } from '@clerk/nextjs/server';
import { createOrg } from '@nugget/api/services';
import { db } from '@nugget/db/client';
import {
  Babies,
  Families,
  FamilyMembers,
  SupplyInventory,
  Users,
} from '@nugget/db/schema';
import { eq } from 'drizzle-orm';
import { revalidatePath } from 'next/cache';
import { createSafeActionClient } from 'next-safe-action';
import { z } from 'zod';

// Create the action client
const action = createSafeActionClient();

// Upsert user in database - ensures user exists before onboarding completion
export const upsertUserAction = action.action(async () => {
  const { userId } = await auth();

  if (!userId) {
    throw new Error('Unauthorized');
  }

  const client = await clerkClient();
  const user = await client.users.getUser(userId);

  const emailAddress = user.primaryEmailAddress?.emailAddress;
  if (!emailAddress) {
    throw new Error('User email not found');
  }

  const [dbUser] = await db
    .insert(Users)
    .values({
      avatarUrl: user.imageUrl ?? null,
      clerkId: userId,
      email: emailAddress,
      firstName: user.firstName ?? null,
      id: userId,
      lastLoggedInAt: new Date(),
      lastName: user.lastName ?? null,
    })
    .onConflictDoUpdate({
      set: {
        avatarUrl: user.imageUrl ?? null,
        email: emailAddress,
        firstName: user.firstName ?? null,
        lastLoggedInAt: new Date(),
        lastName: user.lastName ?? null,
        updatedAt: new Date(),
      },
      target: Users.clerkId,
    })
    .returning();

  if (!dbUser) {
    throw new Error('Failed to upsert user');
  }

  return {
    success: true,
    user: dbUser,
  };
});

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
    };
  }

  const familyMember = await db.query.FamilyMembers.findFirst({
    where: eq(FamilyMembers.userId, userId),
  });

  // Get journey stage from the first baby if it exists
  const baby = await db.query.Babies.findFirst({
    where: eq(Babies.userId, userId),
  });

  return {
    completed: Boolean(familyMember?.onboardingCompletedAt),
    journeyStage: baby?.journeyStage,
    ttcMethod: baby?.ttcMethod,
  };
});

// Complete onboarding action
const completeOnboardingSchema = z.object({
  birthDate: z.string().optional(),
  dueDate: z.string().optional(),
  firstName: z.string().optional(),
  journeyStage: z.enum(['ttc', 'pregnant', 'born']),
  lastName: z.string().optional(),
  lastPeriodDate: z.string().optional(),
  middleName: z.string().optional(),
  ttcMethod: z.enum(['natural', 'ivf', 'other']).optional(),
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

        // Generate family name: use baby's first name if provided (born stage), otherwise use user's first name
        const familyName = parsedInput.firstName
          ? `${parsedInput.firstName}'s Family`
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
            onboardingCompletedAt: new Date(),
            updatedAt: new Date(),
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
        birthDate: parsedInput.birthDate
          ? new Date(parsedInput.birthDate)
          : null,
        dueDate: parsedInput.dueDate ? new Date(parsedInput.dueDate) : null,
        familyId: family.id,
        firstName: parsedInput.firstName || 'Baby',
        journeyStage: parsedInput.journeyStage,
        lastName: parsedInput.lastName || null,
        middleName: parsedInput.middleName || null,
        ttcMethod: parsedInput.ttcMethod || null,
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
