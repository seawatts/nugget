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
import { and, eq } from 'drizzle-orm';
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

// Create family early (before step 3) - creates org, family member, and baby
const createFamilyEarlySchema = z.object({
  birthDate: z.string().optional(),
  birthWeightOz: z.number().optional(),
  dueDate: z.string().optional(),
  firstName: z.string().optional(),
  gender: z.string().optional(),
  journeyStage: z.enum(['ttc', 'pregnant', 'born']),
  lastName: z.string().optional(),
  lastPeriodDate: z.string().optional(),
  middleName: z.string().optional(),
  ttcMethod: z.enum(['natural', 'ivf', 'other']).optional(),
});

export const createFamilyEarlyAction = action
  .inputSchema(createFamilyEarlySchema)
  .action(async ({ parsedInput }) => {
    const { userId, orgId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // If family already exists, just return it
    if (orgId) {
      const family = await db.query.Families.findFirst({
        where: eq(Families.id, orgId),
      });

      if (family) {
        // Also check if baby exists, create if not
        const existingBaby = await db.query.Babies.findFirst({
          where: eq(Babies.userId, userId),
        });

        if (!existingBaby) {
          // Create baby record
          await db.transaction(async (tx) => {
            const babyValues = {
              birthDate: parsedInput.birthDate
                ? new Date(parsedInput.birthDate)
                : null,
              birthWeightOz: parsedInput.birthWeightOz || null,
              dueDate: parsedInput.dueDate
                ? new Date(parsedInput.dueDate)
                : null,
              familyId: family.id,
              firstName: parsedInput.firstName || 'Baby',
              gender: parsedInput.gender || null,
              journeyStage: parsedInput.journeyStage,
              lastName: parsedInput.lastName || null,
              middleName: parsedInput.middleName || null,
              ttcMethod: parsedInput.ttcMethod || null,
              userId,
            };

            const [baby] = await tx
              .insert(Babies)
              .values(babyValues)
              .returning();

            // Create initial supply inventory for the baby
            if (baby) {
              await tx.insert(SupplyInventory).values({
                babyId: baby.id,
                donorMl: 0,
                familyId: family.id,
                formulaMl: 0,
                pumpedMl: 0,
                userId,
              });
            }
          });
        }

        return {
          family,
          success: true,
        };
      }
    }

    // Check if user already has a family in the database
    const existingFamilyMember = await db.query.FamilyMembers.findFirst({
      where: eq(FamilyMembers.userId, userId),
      with: {
        family: true,
      },
    });

    if (existingFamilyMember?.family) {
      return {
        family: existingFamilyMember.family,
        success: true,
      };
    }

    // Create a new family for the user
    const client = await clerkClient();
    const user = await client.users.getUser(userId);

    // Generate family name: use baby's first name if provided, otherwise use user's first name
    const familyName = parsedInput.firstName
      ? `${parsedInput.firstName}'s Family`
      : `${user.firstName || 'My'}'s Family`;

    // Create the organization
    const orgResult = await createOrg({
      name: familyName,
      userId,
    });

    const familyId = orgResult.org.id;

    // Set the new organization as active in Clerk
    await client.users.updateUser(userId, {
      publicMetadata: {
        ...user.publicMetadata,
        activeOrgId: familyId,
      },
    });

    // Fetch the created family and create baby in transaction
    return await db.transaction(async (tx) => {
      const family = await tx.query.Families.findFirst({
        where: eq(Families.id, familyId),
      });

      if (!family) {
        throw new Error('Failed to create family. Please try again.');
      }

      // Create baby record
      const babyValues = {
        birthDate: parsedInput.birthDate
          ? new Date(parsedInput.birthDate)
          : null,
        birthWeightOz: parsedInput.birthWeightOz || null,
        dueDate: parsedInput.dueDate ? new Date(parsedInput.dueDate) : null,
        familyId: family.id,
        firstName: parsedInput.firstName || 'Baby',
        gender: parsedInput.gender || null,
        journeyStage: parsedInput.journeyStage,
        lastName: parsedInput.lastName || null,
        middleName: parsedInput.middleName || null,
        ttcMethod: parsedInput.ttcMethod || null,
        userId,
      };

      const [baby] = await tx.insert(Babies).values(babyValues).returning();

      if (!baby) {
        throw new Error('Failed to create baby record.');
      }

      // Create initial supply inventory for the baby
      await tx.insert(SupplyInventory).values({
        babyId: baby.id,
        donorMl: 0,
        familyId: family.id,
        formulaMl: 0,
        pumpedMl: 0,
        userId,
      });

      return {
        family,
        success: true,
      };
    });
  });

// Complete onboarding action - just marks onboarding as complete
// (family and baby are already created in step 2 -> 3 transition)
const completeOnboardingSchema = z.object({
  // Keep schema for backwards compatibility but fields are optional/unused
  birthDate: z.string().optional(),
  birthWeightOz: z.number().optional(),
  dueDate: z.string().optional(),
  firstName: z.string().optional(),
  gender: z.string().optional(),
  journeyStage: z.enum(['ttc', 'pregnant', 'born']).optional(),
  lastName: z.string().optional(),
  lastPeriodDate: z.string().optional(),
  middleName: z.string().optional(),
  ttcMethod: z.enum(['natural', 'ivf', 'other']).optional(),
});

export const completeOnboardingAction = action
  .inputSchema(completeOnboardingSchema)
  .action(async () => {
    const { userId, orgId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    // At this point, family and baby should already exist (created in step 2 -> 3 transition)
    const familyId = orgId;

    if (!familyId) {
      throw new Error(
        'No family found. Please go back and complete the previous steps.',
      );
    }

    return await db.transaction(async (tx) => {
      // 1. Get existing family
      const family = await tx.query.Families.findFirst({
        where: eq(Families.id, familyId),
      });

      if (!family) {
        throw new Error('Failed to find family. Please try again.');
      }

      // 2. Mark onboarding as complete for family member
      const existingMember = await tx.query.FamilyMembers.findFirst({
        where: eq(FamilyMembers.userId, userId),
      });

      if (!existingMember) {
        throw new Error('Family member not found. Please try again.');
      }

      const [familyMember] = await tx
        .update(FamilyMembers)
        .set({
          onboardingCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(FamilyMembers.id, existingMember.id))
        .returning();

      // 3. Get the baby (should already exist)
      const baby = await tx.query.Babies.findFirst({
        where: eq(Babies.userId, userId),
      });

      if (!baby) {
        throw new Error(
          'Baby record not found. Please go back and complete the previous steps.',
        );
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

// Complete onboarding for a user joining an existing family
const completeOnboardingForExistingFamilySchema = z.object({
  clerkOrgId: z.string(),
});

export const completeOnboardingForExistingFamilyAction = action
  .inputSchema(completeOnboardingForExistingFamilySchema)
  .action(async ({ parsedInput }) => {
    const { userId } = await auth();

    if (!userId) {
      throw new Error('Unauthorized');
    }

    const client = await clerkClient();

    return await db.transaction(async (tx) => {
      // 1. Find the family by Clerk organization ID
      let family = await tx.query.Families.findFirst({
        where: eq(Families.clerkOrgId, parsedInput.clerkOrgId),
      });

      // If family doesn't exist, try to create/update it from Clerk data
      if (!family) {
        console.log(
          `Family not found for clerkOrgId: ${parsedInput.clerkOrgId}, attempting to create from Clerk data`,
        );

        try {
          // Get the organization from Clerk
          const clerkOrg = await client.organizations.getOrganization({
            organizationId: parsedInput.clerkOrgId,
          });

          // Get the user who created the org (or use current user as fallback)
          const createdByUserId = clerkOrg.createdBy || userId;

          // Create or update the family record using onConflictDoUpdate
          // This handles cases where a family with the same name exists
          const [createdFamily] = await tx
            .insert(Families)
            .values({
              clerkOrgId: parsedInput.clerkOrgId,
              createdByUserId,
              id: parsedInput.clerkOrgId,
              name: clerkOrg.name,
            })
            .onConflictDoUpdate({
              set: {
                clerkOrgId: parsedInput.clerkOrgId,
                updatedAt: new Date(),
              },
              target: Families.name,
            })
            .returning();

          family = createdFamily;
          console.log(
            `Created/updated family record for clerkOrgId: ${parsedInput.clerkOrgId}`,
          );
        } catch (error) {
          console.error('Failed to create family from Clerk data:', error);

          // If creation still fails, try to find by name as a fallback
          try {
            const clerkOrg = await client.organizations.getOrganization({
              organizationId: parsedInput.clerkOrgId,
            });

            family = await tx.query.Families.findFirst({
              where: eq(Families.name, clerkOrg.name),
            });

            if (family) {
              console.log(
                `Found existing family by name: ${clerkOrg.name}, updating clerkOrgId`,
              );
              // Update the clerkOrgId to match
              const [updated] = await tx
                .update(Families)
                .set({
                  clerkOrgId: parsedInput.clerkOrgId,
                  updatedAt: new Date(),
                })
                .where(eq(Families.id, family.id))
                .returning();
              family = updated;
            }
          } catch (fallbackError) {
            console.error('Fallback lookup also failed:', fallbackError);
          }

          if (!family) {
            throw new Error(
              'Family not found and could not be created. Please contact support.',
            );
          }
        }
      }

      if (!family) {
        throw new Error('Family not found.');
      }

      // 2. Find or create the family member record for this user and family
      let familyMember = await tx.query.FamilyMembers.findFirst({
        where: and(
          eq(FamilyMembers.userId, userId),
          eq(FamilyMembers.familyId, family.id),
        ),
      });

      if (!familyMember) {
        console.log(
          `Family member not found for user ${userId} in family ${family.id}, creating record`,
        );

        // Create the family member record
        const [createdMember] = await tx
          .insert(FamilyMembers)
          .values({
            familyId: family.id,
            role: 'partner', // Default role for invited members
            userId,
          })
          .returning();

        familyMember = createdMember;
      }

      if (!familyMember) {
        throw new Error('Failed to create or find family member record.');
      }

      // 3. Mark onboarding as complete
      const [updatedMember] = await tx
        .update(FamilyMembers)
        .set({
          onboardingCompletedAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(FamilyMembers.id, familyMember.id))
        .returning();

      // Revalidate paths
      revalidatePath('/app');
      revalidatePath('/app/onboarding');

      return {
        familyMember: updatedMember,
        success: true,
      };
    });
  });
