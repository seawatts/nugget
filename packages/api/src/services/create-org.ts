import {
  clerkClient,
  type Organization,
  type User,
} from '@clerk/nextjs/server';
import { db } from '@nugget/db/client';
import { Families, FamilyMembers, Users } from '@nugget/db/schema';
import { generateRandomName } from '@nugget/id';
import {
  BILLING_INTERVALS,
  createSubscription,
  getFreePlanPriceId,
  PLAN_TYPES,
  upsertStripeCustomer,
} from '@nugget/stripe';
import { eq } from 'drizzle-orm';
import type Stripe from 'stripe';

type Transaction = Parameters<Parameters<typeof db.transaction>[0]>[0];

type CreateOrgParams = {
  name: string;
  userId: string;
};

type CreateOrgResult = {
  org: {
    id: string;
    name: string;
    stripeCustomerId: string;
  };
};

// Helper function to ensure user exists in database
async function ensureUserExists({
  userId,
  userEmail,
  userFirstName,
  userLastName,
  userAvatarUrl,
  tx,
}: {
  userId: string;
  userEmail: string;
  userFirstName?: string | null;
  userLastName?: string | null;
  userAvatarUrl?: string | null;
  tx: Transaction;
}) {
  const existingUser = await tx.query.Users.findFirst({
    where: eq(Users.id, userId),
  });

  if (existingUser) {
    return existingUser;
  }

  const [dbUser] = await tx
    .insert(Users)
    .values({
      avatarUrl: userAvatarUrl ?? null,
      clerkId: userId,
      email: userEmail,
      firstName: userFirstName ?? null,
      id: userId,
      lastLoggedInAt: new Date(),
      lastName: userLastName ?? null,
    })
    .onConflictDoUpdate({
      set: {
        avatarUrl: userAvatarUrl ?? null,
        email: userEmail,
        firstName: userFirstName ?? null,
        lastLoggedInAt: new Date(),
        lastName: userLastName ?? null,
        updatedAt: new Date(),
      },
      target: Users.clerkId,
    })
    .returning();

  if (!dbUser) {
    throw new Error(
      `Failed to create user for userId: ${userId}, email: ${userEmail}`,
    );
  }

  return dbUser;
}

// Helper function to create org in database
async function createOrgInDatabase({
  clerkOrgId,
  name,
  userId,
  tx,
}: {
  clerkOrgId: string;
  name: string;
  userId: string;
  tx: Transaction;
}) {
  const [org] = await tx
    .insert(Families)
    .values({
      clerkOrgId,
      createdByUserId: userId,
      id: clerkOrgId,
      name,
    })
    .returning();

  if (!org) {
    throw new Error(
      `Failed to create organization for clerkOrgId: ${clerkOrgId}, name: ${name}, userId: ${userId}`,
    );
  }

  return org;
}

// Helper function to update org with Stripe customer ID
async function updateOrgWithStripeCustomerId({
  orgId,
  stripeCustomerId,
  tx,
}: {
  orgId: string;
  stripeCustomerId: string;
  tx: Transaction;
}) {
  await tx
    .update(Families)
    .set({
      stripeCustomerId,
      updatedAt: new Date(),
    })
    .where(eq(Families.id, orgId));
}

// Helper function to auto-subscribe to free plan
async function autoSubscribeToFreePlan({
  customerId,
  orgId,
  tx,
}: {
  customerId: string;
  orgId: string;
  tx: Transaction;
}) {
  try {
    // Get the free plan price ID
    const freePriceId = await getFreePlanPriceId();
    if (!freePriceId) {
      console.error(
        `Failed to get free plan price ID for orgId: ${orgId}, customerId: ${customerId}`,
      );
      return null;
    }

    // Create subscription to free plan
    const subscription = await createSubscription({
      billingInterval: BILLING_INTERVALS.MONTHLY,
      customerId,
      orgId,
      planType: PLAN_TYPES.FREE,
      priceId: freePriceId,
    });

    if (!subscription) {
      console.error(
        `Failed to create subscription for orgId: ${orgId}, customerId: ${customerId}, priceId: ${freePriceId}`,
      );
      return null;
    }

    // Update org with subscription info
    await tx
      .update(Families)
      .set({
        stripeCustomerId: customerId,
        stripeSubscriptionId: subscription.id,
        stripeSubscriptionStatus: subscription.status,
        updatedAt: new Date(),
      })
      .where(eq(Families.id, orgId));

    console.log(
      `Auto-subscribed org ${orgId} to free plan with subscription ${subscription.id}`,
    );
    return subscription;
  } catch (error) {
    if (error instanceof Error) {
      console.error(
        `Failed to auto-subscribe to free plan for orgId: ${orgId}, customerId: ${customerId}. Original error: ${error.message}`,
      );
    } else {
      console.error(
        `Failed to auto-subscribe to free plan for orgId: ${orgId}, customerId: ${customerId}`,
      );
    }
    // Don't throw error - org creation should still succeed
    return null;
  }
}

/**
 * Creates a new organization with Stripe integration and API key
 * This function is specifically designed for onboarding new users
 */
export async function createOrg({
  name,
  userId,
}: CreateOrgParams): Promise<CreateOrgResult> {
  return await db.transaction(async (tx) => {
    // Run Clerk client initialization and user existence check in parallel
    const [client, existingUser] = await Promise.all([
      clerkClient(),
      tx.query.Users.findFirst({
        where: eq(Users.id, userId),
      }),
    ]);

    let user: User;
    let userEmail: string;

    try {
      user = await client.users.getUser(userId);
      const emailAddress = user.primaryEmailAddress?.emailAddress;
      if (!emailAddress) {
        throw new Error(`User email not found for userId: ${userId}`);
      }
      userEmail = emailAddress;
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to retrieve user from Clerk for userId: ${userId}. Original error: ${error.message}`,
        );
      }
      throw new Error(
        `Failed to retrieve user from Clerk for userId: ${userId}`,
      );
    }

    // Ensure user exists in database before proceeding (only if user doesn't exist)
    if (!existingUser) {
      await ensureUserExists({
        tx,
        userAvatarUrl: user.imageUrl,
        userEmail,
        userFirstName: user.firstName,
        userId,
        userLastName: user.lastName,
      });
    }

    // Check if organization name already exists in database
    const existingOrgByName = await tx.query.Families.findFirst({
      where: eq(Families.name, name),
    });

    if (existingOrgByName) {
      throw new Error(
        `Organization name "${name}" is already taken. Please choose a different name.`,
      );
    }

    // Generate unique slug
    const slug = generateRandomName();
    let clerkOrg: Organization;

    try {
      clerkOrg = await client.organizations.createOrganization({
        createdBy: userId,
        name,
        slug,
      });

      if (!clerkOrg) {
        throw new Error(
          `Failed to create organization in Clerk for name: ${name}, slug: ${slug}, userId: ${userId}`,
        );
      }
    } catch (error: unknown) {
      // Log the full error for debugging
      console.error('Clerk organization creation error:', error);

      // Handle case where organization with same slug already exists
      if (error && typeof error === 'object' && 'message' in error) {
        const errorMessage = (error as { message: string }).message;
        if (
          errorMessage.indexOf('slug') !== -1 ||
          errorMessage.indexOf('already exists') !== -1
        ) {
          throw new Error(
            `Organization slug "${slug}" is already taken. Please try again.`,
          );
        }

        // Handle forbidden errors with more helpful message
        if (
          errorMessage.toLowerCase().includes('forbidden') ||
          errorMessage.toLowerCase().includes('permission')
        ) {
          throw new Error(
            `Permission denied to create organization. This may be due to: 1) Clerk plan limits (check organization limit per user), 2) Organization creation is disabled in Clerk settings, or 3) User has reached their organization limit. Please check your Clerk Dashboard settings or contact support. Original error: ${errorMessage}`,
          );
        }
      }

      // For other errors, throw immediately
      if (error instanceof Error) {
        throw new Error(
          `Failed to create organization in Clerk for name: ${name}, userId: ${userId}. Original error: ${error.message}`,
        );
      }
      throw new Error(
        `Failed to create organization in Clerk for name: ${name}, userId: ${userId}`,
      );
    }

    // Ensure clerkOrg is assigned
    if (!clerkOrg) {
      throw new Error('Failed to create organization in Clerk');
    }

    // Final check: Double-check that the organization wasn't created by another process
    const finalCheckOrg = await tx.query.Families.findFirst({
      where: eq(Families.clerkOrgId, clerkOrg.id),
    });

    if (finalCheckOrg) {
      console.log(
        'Organization was created by another process (likely webhook), using existing org:',
        finalCheckOrg.id,
      );

      return {
        org: {
          id: finalCheckOrg.clerkOrgId,
          name: finalCheckOrg.name,
          stripeCustomerId: finalCheckOrg.stripeCustomerId || '',
        },
      };
    }

    // Create org in database
    const org = await createOrgInDatabase({
      clerkOrgId: clerkOrg.id,
      name,
      tx,
      userId,
    });

    // Create family member record for the creator
    try {
      await tx
        .insert(FamilyMembers)
        .values({
          familyId: org.id,
          role: 'primary',
          userId,
        })
        .onConflictDoNothing();
      console.log(
        'Created family member record for org creator:',
        userId,
        'in org:',
        org.id,
      );
    } catch (error) {
      console.error('Failed to create family member for org creator:', error);
      // Don't throw - the webhook will handle this if it fails here
    }

    // Create or update Stripe customer
    console.log(
      'Creating/updating Stripe customer for org:',
      org.id,
      'name:',
      name,
    );

    let stripeCustomer: Stripe.Customer;
    try {
      stripeCustomer = await upsertStripeCustomer({
        additionalMetadata: {
          orgName: name,
          userId,
        },
        email: userEmail,
        name,
        orgId: org.id,
      });
      if (!stripeCustomer) {
        throw new Error(
          `Failed to create or get Stripe customer for orgId: ${org.id}, name: ${name}, email: ${userEmail}`,
        );
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(
          `Failed to create or get Stripe customer for orgId: ${org.id}, name: ${name}, email: ${userEmail}. Original error: ${error.message}`,
        );
      }
      throw new Error(
        `Failed to create or get Stripe customer for orgId: ${org.id}, name: ${name}, email: ${userEmail}`,
      );
    }

    console.log(
      'Stripe customer created/updated:',
      stripeCustomer.id,
      'for org:',
      org.id,
    );

    // Run database updates and Clerk update in parallel
    await Promise.all([
      // Update org in database with Stripe customer ID
      updateOrgWithStripeCustomerId({
        orgId: org.id,
        stripeCustomerId: stripeCustomer.id,
        tx,
      }),
      // Update org in Clerk with Stripe customer ID
      client.organizations.updateOrganization(clerkOrg.id, {
        name,
        privateMetadata: {
          stripeCustomerId: stripeCustomer.id,
        },
      }),
    ]);

    // Auto-subscribe to free plan
    await autoSubscribeToFreePlan({
      customerId: stripeCustomer.id,
      orgId: org.id,
      tx,
    });

    return {
      org: {
        id: org.clerkOrgId,
        name: org.name,
        stripeCustomerId: stripeCustomer.id,
      },
    };
  });
}
