import { createClerkClient } from '@clerk/backend';
import { db } from '@nugget/db/client';
import { Families, Users } from '@nugget/db/schema';
import { createId } from '@nugget/id';
import { eq } from 'drizzle-orm';
import { env } from './env';

export interface TestUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  clerkId: string;
}

export interface TestOrg {
  id: string;
  name: string;
  clerkOrgId: string;
  ownerId: string;
}

export interface TestSetup {
  user: TestUser;
  org: TestOrg;
  cleanup: () => Promise<void>;
}

const clerkClient = createClerkClient({
  publishableKey: env.CLERK_PUBLISHABLE_KEY,
  secretKey: env.CLERK_SECRET_KEY,
});

/**
 * Creates a test user in Clerk and the database
 */
export async function createTestUser(
  email = `test-${Date.now()}@example.com`,
  firstName = 'Test',
  lastName = 'User',
): Promise<TestUser> {
  try {
    // Create user in Clerk
    const clerkUser = await clerkClient.users.createUser({
      emailAddress: [email],
      firstName,
      lastName,
      legalAcceptedAt: new Date(),
      password: createId(),
      skipLegalChecks: true,
      skipPasswordChecks: true,
    });

    if (!clerkUser.id) {
      throw new Error('Failed to create Clerk user');
    }

    // Create user in database
    const [dbUser] = await db
      .insert(Users)
      .values({
        clerkId: clerkUser.id,
        email,
        firstName,
        id: clerkUser.id,
        lastName,
      })
      .returning();

    if (!dbUser) {
      throw new Error('Failed to create user in database');
    }

    return {
      clerkId: dbUser.clerkId,
      email: dbUser.email,
      firstName: dbUser.firstName || firstName,
      id: dbUser.id,
      lastName: dbUser.lastName || lastName,
    };
  } catch (error) {
    console.error('Error creating test user:', error);
    throw error;
  }
}

/**
 * Creates a test organization in Clerk and the database
 */
export async function createTestOrg(
  ownerId: string,
  name = `Test Organization ${Date.now()}`,
): Promise<TestOrg> {
  // Create organization in Clerk
  const clerkOrg = await clerkClient.organizations.createOrganization({
    createdBy: ownerId,
    name,
  });

  if (!clerkOrg.id) {
    throw new Error('Failed to create Clerk organization');
  }

  // Create organization in database
  const [dbOrg] = await db
    .insert(Families)
    .values({
      clerkOrgId: clerkOrg.id,
      createdByUserId: ownerId,
      id: clerkOrg.id,
      name,
    })
    .returning();

  if (!dbOrg) {
    throw new Error('Failed to create organization in database');
  }

  return {
    clerkOrgId: dbOrg.clerkOrgId,
    id: dbOrg.id,
    name: dbOrg.name,
    ownerId: dbOrg.createdByUserId,
  };
}

/**
 * Creates a complete test setup with user and org
 */
export async function createTestSetup(
  options: {
    userEmail?: string;
    userName?: { firstName?: string; lastName?: string };
    orgName?: string;
  } = {},
): Promise<TestSetup> {
  const { userEmail, userName, orgName } = options;

  // Create test user
  const user = await createTestUser(
    userEmail,
    userName?.firstName,
    userName?.lastName,
  );

  // Create test organization
  const org = await createTestOrg(user.id, orgName);

  // Create cleanup function
  const cleanup = async () => {
    try {
      // Clean up organization from database
      await db.delete(Families).where(eq(Families.id, org.id));

      // Clean up user from database
      await db.delete(Users).where(eq(Users.id, user.id));

      // Clean up organization from Clerk
      try {
        await clerkClient.organizations.deleteOrganization(org.clerkOrgId);
      } catch (error) {
        console.warn('Failed to delete Clerk organization:', error);
      }

      // Clean up user from Clerk
      try {
        await clerkClient.users.deleteUser(user.clerkId);
      } catch (error) {
        console.warn('Failed to delete Clerk user:', error);
      }
    } catch (error) {
      console.error('Error during test cleanup:', error);
    }
  };

  return {
    cleanup,
    org,
    user,
  };
}
