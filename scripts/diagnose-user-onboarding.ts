#!/usr/bin/env bun
/**
 * Diagnostic script to identify why a user is stuck on onboarding
 *
 * Usage:
 *   # Diagnose Amanda
 *   infisical --env=prod run -- bun run scripts/diagnose-user-onboarding.ts
 *
 *   # Diagnose specific user
 *   infisical --env=prod run -- bun run scripts/diagnose-user-onboarding.ts user_xxxxx
 *
 *   # Apply fix
 *   infisical --env=prod run -- bun run scripts/diagnose-user-onboarding.ts user_xxxxx --fix
 */

import { db } from '@nugget/db/client';
import {
  Activities,
  Babies,
  type Families,
  FamilyMembers,
  Users,
} from '@nugget/db/schema';
import { eq } from 'drizzle-orm';

// Parse command line arguments
const args = process.argv.slice(2);
const DEFAULT_USER_ID = 'user_35dWrl5XmorgIPg9vCn4EA778qL'; // Amanda's Clerk ID
let userId = DEFAULT_USER_ID;
let shouldFix = false;

// Parse arguments
for (const arg of args) {
  if (arg === '--fix') {
    shouldFix = true;
  } else if (arg.startsWith('user_')) {
    userId = arg;
  }
}

interface DiagnosticResult {
  user: typeof Users.$inferSelect | undefined;
  familyMemberships: Array<{
    familyMember: typeof FamilyMembers.$inferSelect;
    family: typeof Families.$inferSelect;
  }>;
  babies: Array<typeof Babies.$inferSelect>;
  activityCount: number;
  diagnosis: {
    isStuck: boolean;
    reason: string[];
    canFix: boolean;
  };
}

async function diagnoseUser(clerkUserId: string): Promise<DiagnosticResult> {
  console.log('\n🔍 Querying database...\n');

  // 1. Get user record
  const user = await db.query.Users.findFirst({
    where: eq(Users.clerkId, clerkUserId),
  });

  if (!user) {
    throw new Error(`User not found with Clerk ID: ${clerkUserId}`);
  }

  // 2. Get all family memberships with family details
  const familyMembers = await db.query.FamilyMembers.findMany({
    where: eq(FamilyMembers.userId, user.id),
    with: {
      family: true,
    },
  });

  const familyMemberships = familyMembers.map((fm) => ({
    family: fm.family!,
    familyMember: fm,
  }));

  // 3. Get all babies
  const babies = await db.query.Babies.findMany({
    where: eq(Babies.userId, user.id),
  });

  // 4. Get activity count
  const activities = await db.query.Activities.findMany({
    where: eq(Activities.userId, user.id),
  });
  const activityCount = activities.length;

  // 5. Diagnose the issue
  const diagnosis = {
    canFix: false,
    isStuck: false,
    reason: [] as string[],
  };

  if (familyMemberships.length === 0) {
    diagnosis.isStuck = true;
    diagnosis.reason.push('User has no family memberships');
    diagnosis.canFix = false;
  } else {
    const incompleteMemberships = familyMemberships.filter(
      (fm) => !fm.familyMember.onboardingCompletedAt,
    );

    if (incompleteMemberships.length > 0) {
      diagnosis.isStuck = true;
      diagnosis.reason.push(
        `User has ${incompleteMemberships.length} family membership(s) with onboardingCompletedAt = null`,
      );
      diagnosis.reason.push('checkOnboarding() returns completed=false');
      diagnosis.reason.push('User gets redirected to /app/onboarding');
      diagnosis.canFix = true;
    }
  }

  return {
    activityCount,
    babies,
    diagnosis,
    familyMemberships,
    user,
  };
}

async function fixOnboarding(
  clerkUserId: string,
  result: DiagnosticResult,
): Promise<void> {
  if (!result.diagnosis.isStuck) {
    console.log('✅ No fix needed - onboarding is already completed\n');
    return;
  }

  if (!result.diagnosis.canFix) {
    console.log(
      '❌ Cannot apply fix - user needs to complete onboarding flow\n',
    );
    console.log(
      '   User has no family memberships. They need to create or join a family.\n',
    );
    return;
  }

  console.log('\n🔧 Applying fix...\n');

  let fixedCount = 0;
  await db.transaction(async (tx) => {
    for (const { familyMember } of result.familyMemberships) {
      if (!familyMember.onboardingCompletedAt) {
        const before = familyMember.onboardingCompletedAt;
        const now = new Date();

        await tx
          .update(FamilyMembers)
          .set({
            onboardingCompletedAt: now,
            updatedAt: now,
          })
          .where(eq(FamilyMembers.id, familyMember.id));

        console.log(`✅ Updated FamilyMember: ${familyMember.id}`);
        console.log(`   Family: ${familyMember.familyId}`);
        console.log(`   Before: onboardingCompletedAt = ${before}`);
        console.log(`   After:  onboardingCompletedAt = ${now.toISOString()}`);
        console.log('');
        fixedCount++;
      }
    }
  });

  if (fixedCount > 0) {
    console.log(
      `✨ Fix applied successfully! Updated ${fixedCount} family membership(s).\n`,
    );
    console.log(
      'User should now be able to access the app without being redirected to onboarding.\n',
    );
  } else {
    console.log(
      'ℹ️  No updates needed - all family memberships already have onboarding completed.\n',
    );
  }
}

function printResults(result: DiagnosticResult): void {
  const { user, familyMemberships, babies, activityCount, diagnosis } = result;

  console.log('═══════════════════════════════════════════════════════════');
  console.log('           USER ONBOARDING DIAGNOSIS REPORT');
  console.log('═══════════════════════════════════════════════════════════\n');

  // User Info
  console.log('👤 USER INFORMATION');
  console.log('───────────────────────────────────────────────────────────');
  console.log(
    `Name:       ${user!.firstName || ''} ${user!.lastName || ''}`.trim() ||
      'N/A',
  );
  console.log(`Email:      ${user!.email}`);
  console.log(`Clerk ID:   ${user!.clerkId}`);
  console.log(`DB ID:      ${user!.id}`);
  console.log(`Created:    ${user!.createdAt?.toISOString() || 'N/A'}`);
  console.log(`Last Login: ${user!.lastLoggedInAt?.toISOString() || 'N/A'}`);
  console.log('');

  // Family Memberships
  console.log('👨‍👩‍👧‍👦 FAMILY MEMBERSHIPS');
  console.log('───────────────────────────────────────────────────────────');
  if (familyMemberships.length === 0) {
    console.log('  ❌ No family memberships found');
  } else {
    familyMemberships.forEach((fm, index) => {
      const status = fm.familyMember.onboardingCompletedAt ? '✅' : '❌';
      console.log(`  ${index + 1}. ${fm.family.name}`);
      console.log(`     Family ID:    ${fm.family.id}`);
      console.log(`     Clerk Org ID: ${fm.family.clerkOrgId}`);
      console.log(`     Role:         ${fm.familyMember.role || 'N/A'}`);
      console.log(`     User Role:    ${fm.familyMember.userRole || 'N/A'}`);
      console.log(
        `     Onboarding:   ${status} ${fm.familyMember.onboardingCompletedAt?.toISOString() || 'NOT COMPLETED'}`,
      );
      console.log(
        `     Joined:       ${fm.familyMember.createdAt?.toISOString() || 'N/A'}`,
      );
      console.log('');
    });
  }

  // Babies
  console.log('👶 BABIES');
  console.log('───────────────────────────────────────────────────────────');
  if (babies.length === 0) {
    console.log('  No babies found');
  } else {
    babies.forEach((baby, index) => {
      console.log(
        `  ${index + 1}. ${baby.firstName} ${baby.lastName || ''}`.trim(),
      );
      console.log(`     Baby ID:       ${baby.id}`);
      console.log(`     Journey Stage: ${baby.journeyStage || 'N/A'}`);
      console.log(
        `     Birth Date:    ${baby.birthDate?.toISOString() || 'N/A'}`,
      );
      console.log(
        `     Due Date:      ${baby.dueDate?.toISOString() || 'N/A'}`,
      );
      console.log('');
    });
  }

  // Activity Count
  console.log('📊 ACTIVITY DATA');
  console.log('───────────────────────────────────────────────────────────');
  console.log(`  Total Activities: ${activityCount}`);
  console.log('');

  // Diagnosis
  console.log('🔍 DIAGNOSIS');
  console.log('───────────────────────────────────────────────────────────');
  if (diagnosis.isStuck) {
    console.log('  ❌ STUCK ON ONBOARDING\n');
    diagnosis.reason.forEach((reason) => {
      console.log(`  • ${reason}`);
    });
    console.log('');
  } else {
    console.log('  ✅ ONBOARDING COMPLETED - No issues detected\n');
  }

  // Recommended Fix
  if (diagnosis.isStuck) {
    console.log('💡 RECOMMENDED FIX');
    console.log('───────────────────────────────────────────────────────────');
    if (diagnosis.canFix) {
      console.log('  Run with --fix flag to mark onboarding as complete:\n');
      console.log(
        `  infisical --env=prod run -- bun run scripts/diagnose-user-onboarding.ts ${user!.clerkId} --fix`,
      );
      console.log('');
      console.log('  Or use the npm script:');
      console.log(`  bun diagnose:user ${user!.clerkId} --fix`);
    } else {
      console.log('  ⚠️  User needs to complete the onboarding flow.');
      console.log(
        '  Cannot automatically fix - user has no family memberships.',
      );
    }
    console.log('');
  }

  console.log('═══════════════════════════════════════════════════════════\n');
}

// Main execution
async function main() {
  try {
    console.log('\n🚀 User Onboarding Diagnostic Tool\n');
    console.log(`Target User: ${userId}`);
    console.log(`Mode: ${shouldFix ? '🔧 FIX' : '🔍 DIAGNOSE'}\n`);

    const result = await diagnoseUser(userId);
    printResults(result);

    if (shouldFix) {
      await fixOnboarding(userId, result);
    }

    process.exit(0);
  } catch (error) {
    console.error('\n❌ Error:', error);
    if (error instanceof Error) {
      console.error(error.message);
      console.error(error.stack);
    }
    process.exit(1);
  }
}

main();
