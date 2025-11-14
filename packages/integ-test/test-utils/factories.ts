import { faker } from '@faker-js/faker';
import * as schema from '@nugget/db/schema';
import { createId } from '@nugget/id';
import type { PostgresJsDatabase } from 'drizzle-orm/postgres-js';

export class TestFactories {
  constructor(private db: PostgresJsDatabase<typeof schema>) {}

  async createUser(
    overrides?: Partial<schema.UserType>,
  ): Promise<schema.UserType> {
    const user = {
      avatarUrl: faker.image.avatar(),
      clerkId: `clerk_${faker.string.alphanumeric(20)}`,
      createdAt: new Date(),
      email: faker.internet.email(),
      firstName: faker.person.firstName(),
      id: createId({ prefix: 'user' }),
      lastName: faker.person.lastName(),
      online: false,
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Users)
      .values(user)
      .returning();
    if (!created) {
      throw new Error('Failed to create user');
    }
    return created;
  }

  async createOrg(
    overrides?: Partial<schema.FamilyType>,
  ): Promise<schema.FamilyType> {
    const user = await this.createUser();

    const org = {
      clerkOrgId: `org_${faker.string.alphanumeric(20)}`,
      createdAt: new Date(),
      createdByUserId: user.id,
      id: createId({ prefix: 'family' }),
      name: faker.company.name(),
      stripeCustomerId: faker.string.alphanumeric(20),
      stripeSubscriptionId: faker.string.alphanumeric(20),
      stripeSubscriptionStatus: 'active' as const,
      ...overrides,
    };

    const [created] = await this.db
      .insert(schema.Families)
      .values(org)
      .returning();
    if (!created) {
      throw new Error('Failed to create org');
    }
    return created;
  }

  async createOrgMember(
    userId: string,
    familyId: string,
    role: 'primary' | 'partner' | 'caregiver' = 'primary',
  ): Promise<schema.FamilyMemberType> {
    const member = {
      createdAt: new Date(),
      familyId,
      id: createId({ prefix: 'member' }),
      role,
      userId,
    };

    const [created] = await this.db
      .insert(schema.FamilyMembers)
      .values(member)
      .returning();
    if (!created) {
      throw new Error('Failed to create org member');
    }
    return created;
  }

  async createCompleteSetup(overrides?: {
    user?: Partial<schema.UserType>;
    org?: Partial<schema.FamilyType>;
  }) {
    // Create user
    const user = await this.createUser(overrides?.user);

    // Create org
    const org = await this.createOrg({
      createdByUserId: user.id,
      ...overrides?.org,
    });

    // Add user as org member
    await this.createOrgMember(user.id, org.id, 'primary');

    return { org, user };
  }
}
