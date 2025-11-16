import { sql } from 'drizzle-orm';
import { db } from '../src/client';

type PolicyOperation = 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE' | 'ALL';

interface Policy {
  name: string;
  operation: PolicyOperation;
  using?: string;
  withCheck?: string;
}

interface PolicyConfig {
  tableName: string;
  policies: Policy[];
}

// Create the requesting_user_id function as per Clerk docs
const createRequestingUserIdFunction = async () => {
  console.log('Creating requesting_user_id function...');
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION requesting_user_id()
    RETURNS text
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = ''
    AS $$
      SELECT NULLIF(
        current_setting('request.jwt.claims', true)::json->>'sub',
        ''
      )::text;
    $$;
  `);
  console.log('requesting_user_id function created successfully');
};

// Create the requesting_family_id function for consistency
const createRequestingFamilyIdFunction = async () => {
  console.log('Creating requesting_family_id function...');
  await db.execute(sql`
    CREATE OR REPLACE FUNCTION requesting_family_id()
    RETURNS text
    LANGUAGE sql
    STABLE
    SECURITY DEFINER
    SET search_path = ''
    AS $$
      SELECT NULLIF(
        current_setting('request.jwt.claims', true)::json->>'org_id',
        ''
      )::text;
    $$;
  `);
  console.log('requesting_family_id function created successfully');
};

// Common policy conditions using the requesting_user_id function
const policyConditions = {
  familyOwnership: (columnName = 'familyId') =>
    `(SELECT requesting_family_id()) = ("${columnName}")::text`,
  userOwnership: (columnName = 'userId') =>
    `(SELECT requesting_user_id()) = ("${columnName}")::text`,
  webhookOwnership: `EXISTS (
    SELECT 1 FROM webhooks
    WHERE webhooks.id = requests."webhookId"
    AND webhooks."familyId" = (SELECT requesting_family_id())
  )`,
} as const;

// Helper to create a policy for user ownership
const createUserOwnershipPolicy = (
  operation: PolicyOperation,
  columnName: string,
): Policy => ({
  name: `User can ${operation.toLowerCase()} their own records`,
  operation,
  using:
    operation === 'INSERT'
      ? undefined
      : policyConditions.userOwnership(columnName),
  withCheck:
    operation === 'INSERT'
      ? policyConditions.userOwnership(columnName)
      : undefined,
});

// Helper to create a policy for family ownership
const createFamilyOwnershipPolicy = (
  operation: PolicyOperation,
  columnName: string,
): Policy => ({
  name: `Users can ${operation.toLowerCase()} their family's records`,
  operation,
  using: policyConditions.familyOwnership(columnName),
});

const createPolicy = async (tableName: string, policy: Policy) => {
  const { name, operation, using, withCheck } = policy;

  // First drop the policy if it exists
  await db.execute(sql`
    DROP POLICY IF EXISTS ${sql.raw(`"${name}"`)} ON "public"."${sql.raw(tableName)}";
  `);

  // Then create the new policy
  const policySql = sql`
    CREATE POLICY ${sql.raw(`"${name}"`)}
    ON "public"."${sql.raw(tableName)}"
    ${operation === 'ALL' ? sql`FOR ALL` : sql`FOR ${sql.raw(operation)}`}
    TO authenticated
    ${using ? sql`USING (${sql.raw(using)})` : sql``}
    ${withCheck ? sql`WITH CHECK (${sql.raw(withCheck)})` : sql``}
  `;

  await db.execute(policySql);
};

const dropPolicy = async (tableName: string, policyName: string) => {
  await db.execute(sql`
    DROP POLICY IF EXISTS ${sql.raw(`"${policyName}"`)} ON "public"."${sql.raw(tableName)}";
  `);
};

const enableRLS = async (tableName: string) => {
  console.log(`Enabling RLS for table: ${tableName}`);
  await db.execute(sql`
    ALTER TABLE "public"."${sql.raw(tableName)}" ENABLE ROW LEVEL SECURITY;
  `);
  console.log(`RLS enabled for table: ${tableName}`);
};

const policyConfigs: Record<string, PolicyConfig> = {
  activities: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'activities',
  },
  babies: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'babies',
  },
  chatMessages: {
    policies: [
      {
        name: 'Family members can manage chat messages',
        operation: 'ALL',
        using: `"chatMessages"."chatId" IN (
          SELECT "chats"."id"
          FROM "chats"
          WHERE "chats"."familyId" = (SELECT requesting_family_id())
        )`,
      },
    ],
    tableName: 'chatMessages',
  },
  chats: {
    policies: [createFamilyOwnershipPolicy('ALL', 'familyId')],
    tableName: 'chats',
  },
  contentCache: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'contentCache',
  },
  families: {
    policies: [
      // Users can access families they created
      {
        name: 'Users can select families they created',
        operation: 'SELECT',
        using: policyConditions.userOwnership('createdByUserId'),
      },
      {
        name: 'Users can insert families',
        operation: 'INSERT',
        withCheck: policyConditions.userOwnership('createdByUserId'),
      },
      {
        name: 'Users can update families they created',
        operation: 'UPDATE',
        using: policyConditions.userOwnership('createdByUserId'),
        withCheck: policyConditions.userOwnership('createdByUserId'),
      },
    ],
    tableName: 'families',
  },
  familyMembers: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createFamilyOwnershipPolicy('ALL', 'familyId'),
    ],
    tableName: 'familyMembers',
  },
  growthRecords: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'growthRecords',
  },
  invitations: {
    policies: [
      createUserOwnershipPolicy('ALL', 'invitedByUserId'),
      createFamilyOwnershipPolicy('ALL', 'familyId'),
    ],
    tableName: 'invitations',
  },
  medicalRecords: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'medicalRecords',
  },
  milestones: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'milestones',
  },
  pushSubscriptions: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'pushSubscriptions',
  },
  shortUrls: {
    policies: [
      createUserOwnershipPolicy('ALL', 'userId'),
      createFamilyOwnershipPolicy('ALL', 'familyId'),
    ],
    tableName: 'shortUrls',
  },
  supplyInventory: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'supplyInventory',
  },
  supplyTransactions: {
    policies: [createUserOwnershipPolicy('ALL', 'userId')],
    tableName: 'supplyTransactions',
  },
  users: {
    policies: [
      createUserOwnershipPolicy('SELECT', 'id'),
      createUserOwnershipPolicy('UPDATE', 'id'),
      // Allow users to read other users in the same family
      {
        name: 'Users can select family members',
        operation: 'SELECT',
        using: `"users"."id" IN (
          SELECT fm2."userId"
          FROM "familyMembers" fm1
          JOIN "familyMembers" fm2 USING ("familyId")
          WHERE fm1."userId" = (SELECT requesting_user_id())
        )`,
      },
    ],
    tableName: 'users',
  },
};

async function withErrorHandling<T>(
  operation: () => Promise<T>,
  successMessage: string,
  errorMessage: string,
): Promise<T> {
  try {
    const result = await operation();
    console.log(successMessage);
    return result;
  } catch (error) {
    console.error(errorMessage, error);
    throw error;
  }
}

async function setupTablePolicies(config: PolicyConfig) {
  return withErrorHandling(
    async () => {
      await enableRLS(config.tableName);
      await Promise.all(
        config.policies.map((policy) => createPolicy(config.tableName, policy)),
      );
    },
    `Policies for ${config.tableName} set up successfully`,
    `Error setting up policies for ${config.tableName}`,
  );
}

async function dropTablePolicies(config: PolicyConfig) {
  return withErrorHandling(
    async () => {
      await Promise.all(
        config.policies.map((policy) =>
          dropPolicy(config.tableName, policy.name),
        ),
      );
    },
    `Policies for ${config.tableName} dropped successfully`,
    `Error dropping policies for ${config.tableName}`,
  );
}

async function setupAllPolicies() {
  return withErrorHandling(
    async () => {
      // First create the requesting_user_id and requesting_family_id functions
      await createRequestingUserIdFunction();
      await createRequestingFamilyIdFunction();

      // Process tables sequentially to avoid deadlocks
      for (const config of Object.values(policyConfigs)) {
        await setupTablePolicies(config);
      }
    },
    'All policies have been set up successfully',
    'Error setting up policies',
  );
}

async function _dropAllPolicies() {
  return withErrorHandling(
    async () => {
      await Promise.all(Object.values(policyConfigs).map(dropTablePolicies));
    },
    'All policies have been dropped successfully',
    'Error dropping policies',
  );
}

// _dropAllPolicies()
//   .then(() => {
//     console.log('Policy setup completed');
//     process.exit(0);
//   })
//   .catch((error) => {
//     console.error('Policy setup failed:', error);
//     process.exit(1);
//   });
setupAllPolicies()
  .then(() => {
    console.log('Policy setup completed');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Policy setup failed:', error);
    process.exit(1);
  });
