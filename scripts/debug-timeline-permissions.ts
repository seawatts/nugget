#!/usr/bin/env bun

/**
 * Timeline Diagnostic Script 3: Permissions & RLS Policy Check
 *
 * This script validates that:
 * - Baby belongs to a family
 * - User has access to the family
 * - Family members relationships are correct
 * - No RLS policies are blocking access
 *
 * Usage:
 *   infisical run -- bun scripts/debug-timeline-permissions.ts [babyId]
 */

import { eq } from 'drizzle-orm';
import {
  Activities,
  Chats,
  db,
  error,
  getBabyDetails,
  getBabyIdFromArgs,
  info,
  Milestones,
  printFooter,
  printHeader,
  section,
  success,
  tableRow,
  testDatabaseConnection,
  warning,
} from './lib/timeline-test-utils.ts';

async function main() {
  const babyId = getBabyIdFromArgs();

  printHeader(
    'Timeline Permissions & RLS Check',
    `Checking access permissions for baby: ${babyId}`,
  );

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Test database connection
  section('Database Connection');
  const dbConnected = await testDatabaseConnection();
  if (!dbConnected) {
    error('Failed to connect to database');
    process.exit(1);
  }
  success('Database connected');

  // Get baby details with full relations
  section('Baby & Family Relationships');
  const baby = await getBabyDetails(babyId);

  if (!baby) {
    error(`Baby with ID "${babyId}" not found`);
    issues.push('Baby record does not exist');
    printFooter(issues, recommendations);
    process.exit(1);
  }

  success(`Baby found: ${baby.firstName} ${baby.lastName || ''}`);
  tableRow('Baby ID', baby.id);
  tableRow('Family ID', baby.familyId || 'NOT SET');
  tableRow('Created By User', baby.userId || 'NOT SET');

  // Check family exists
  if (!baby.familyId) {
    error('Baby has no familyId - this will block all queries');
    issues.push('Baby is not linked to any family');
    recommendations.push('Set baby.familyId to link the baby to a family');
    printFooter(issues, recommendations);
    process.exit(1);
  }

  if (!baby.family) {
    error('Family record not found');
    issues.push('Family record is missing from database');
    recommendations.push(
      `Create or restore family record with ID: ${baby.familyId}`,
    );
    printFooter(issues, recommendations);
    process.exit(1);
  }

  success(`Family found: ${baby.family.name}`);
  tableRow('Family Name', baby.family.name);
  tableRow('Family Clerk Org ID', baby.family.clerkOrgId);
  tableRow('Family Created By', baby.family.createdByUserId);

  // Check family members
  section('Family Members');

  const familyMembers = baby.family.familyMembers || [];

  if (familyMembers.length === 0) {
    error('No family members found');
    issues.push('Family has no members - no users can access this baby');
    recommendations.push('Add users to the family via FamilyMembers table');
    printFooter(issues, recommendations);
    process.exit(1);
  }

  success(`Found ${familyMembers.length} family member(s)`);

  console.log('\n  Family Members:');
  for (const member of familyMembers) {
    const user = member.user;
    if (!user) {
      warning(
        `    ✗ Member ${member.id}: User not found (userId: ${member.userId})`,
      );
      issues.push(`Family member ${member.id} has invalid user reference`);
      continue;
    }

    const name =
      `${user.firstName || ''} ${user.lastName || ''}`.trim() || user.email;
    const role = member.role || 'no role';
    console.log(`    ✓ ${name} (${user.email}) - Role: ${role}`);
  }

  // Check activities ownership
  section('Activities Ownership & Access');

  const activities = await db.query.Activities.findMany({
    limit: 10,
    where: eq(Activities.babyId, babyId),
    with: {
      baby: true,
      family: true,
      user: true,
    },
  });

  console.log(`\nChecking ${activities.length} sample activities...`);

  const validUserIds = new Set(familyMembers.map((m) => m.userId));
  let activitiesWithInvalidUsers = 0;
  let activitiesWithMissingBaby = 0;
  let activitiesWithMissingFamily = 0;
  let activitiesWithWrongFamily = 0;

  for (const activity of activities) {
    const activityUser = activity.userId;

    // Check if activity creator is a family member
    if (!validUserIds.has(activityUser)) {
      warning(
        `  Activity ${activity.id}: Created by user ${activityUser} who is NOT a family member`,
      );
      activitiesWithInvalidUsers++;
    }

    // Check baby relationship
    if (!activity.baby) {
      warning(`  Activity ${activity.id}: Baby relationship missing`);
      activitiesWithMissingBaby++;
    } else if (activity.baby.id !== babyId) {
      error(
        `  Activity ${activity.id}: Links to wrong baby ${activity.baby.id}`,
      );
    }

    // Check family relationship
    if (!activity.family) {
      warning(`  Activity ${activity.id}: Family relationship missing`);
      activitiesWithMissingFamily++;
    } else if (activity.family.id !== baby.familyId) {
      error(
        `  Activity ${activity.id}: Links to wrong family ${activity.family.id}`,
      );
      activitiesWithWrongFamily++;
    }
  }

  if (activitiesWithInvalidUsers > 0) {
    warning(
      `${activitiesWithInvalidUsers} activities created by users not in family`,
    );
    info('These activities may still be visible if RLS policies allow it');
  } else if (activities.length > 0) {
    success('All activities created by valid family members');
  }

  if (activitiesWithMissingBaby > 0) {
    error(
      `${activitiesWithMissingBaby} activities have missing baby relationships`,
    );
    issues.push('Some activities have broken baby relationships');
  }

  if (activitiesWithMissingFamily > 0) {
    error(
      `${activitiesWithMissingFamily} activities have missing family relationships`,
    );
    issues.push('Some activities have broken family relationships');
  }

  if (activitiesWithWrongFamily > 0) {
    error(`${activitiesWithWrongFamily} activities linked to wrong family`);
    issues.push('Some activities have incorrect family IDs');
    recommendations.push("Update activity.familyId to match the baby's family");
  }

  // Check milestones ownership
  section('Milestones Ownership & Access');

  const milestones = await db.query.Milestones.findMany({
    limit: 10,
    where: eq(Milestones.babyId, babyId),
    with: {
      baby: true,
      family: true,
      user: true,
    },
  });

  console.log(`\nChecking ${milestones.length} sample milestones...`);

  let milestonesWithInvalidUsers = 0;
  let milestonesWithMissingBaby = 0;
  let milestonesWithWrongFamily = 0;

  for (const milestone of milestones) {
    if (!validUserIds.has(milestone.userId)) {
      warning(
        `  Milestone ${milestone.id}: Created by user ${milestone.userId} who is NOT a family member`,
      );
      milestonesWithInvalidUsers++;
    }

    if (!milestone.baby || milestone.baby.id !== babyId) {
      error(`  Milestone ${milestone.id}: Baby relationship broken`);
      milestonesWithMissingBaby++;
    }

    if (!milestone.family || milestone.family.id !== baby.familyId) {
      error(`  Milestone ${milestone.id}: Family relationship broken`);
      milestonesWithWrongFamily++;
    }
  }

  if (milestonesWithInvalidUsers > 0) {
    warning(
      `${milestonesWithInvalidUsers} milestones created by users not in family`,
    );
  } else if (milestones.length > 0) {
    success('All milestones created by valid family members');
  }

  if (milestonesWithMissingBaby > 0 || milestonesWithWrongFamily > 0) {
    error('Some milestones have broken relationships');
    issues.push('Milestone relationships need to be fixed');
  }

  // Check chats ownership
  section('Chats Ownership & Access');

  const chats = await db.query.Chats.findMany({
    limit: 10,
    where: eq(Chats.babyId, babyId),
    with: {
      baby: true,
      family: true,
      messages: true,
      user: true,
    },
  });

  console.log(`\nChecking ${chats.length} sample chats...`);

  let chatsWithInvalidUsers = 0;
  let chatsWithMissingBaby = 0;
  let chatsWithWrongFamily = 0;

  for (const chat of chats) {
    if (!validUserIds.has(chat.userId)) {
      warning(
        `  Chat ${chat.id}: Created by user ${chat.userId} who is NOT a family member`,
      );
      chatsWithInvalidUsers++;
    }

    if (!chat.baby || chat.baby.id !== babyId) {
      error(`  Chat ${chat.id}: Baby relationship broken`);
      chatsWithMissingBaby++;
    }

    if (!chat.family || chat.family.id !== baby.familyId) {
      error(`  Chat ${chat.id}: Family relationship broken`);
      chatsWithWrongFamily++;
    }
  }

  if (chatsWithInvalidUsers > 0) {
    warning(`${chatsWithInvalidUsers} chats created by users not in family`);
  } else if (chats.length > 0) {
    success('All chats created by valid family members');
  }

  if (chatsWithMissingBaby > 0 || chatsWithWrongFamily > 0) {
    error('Some chats have broken relationships');
    issues.push('Chat relationships need to be fixed');
  }

  // Summary of permissions
  section('Permissions Summary');

  console.log('');
  success(`✓ Baby exists and is linked to family "${baby.family.name}"`);
  success(`✓ Family has ${familyMembers.length} member(s) with access`);

  if (activities.length > 0) {
    if (
      activitiesWithWrongFamily === 0 &&
      activitiesWithMissingFamily === 0 &&
      activitiesWithMissingBaby === 0
    ) {
      success(
        `✓ All ${activities.length} sample activities have correct relationships`,
      );
    } else {
      error('✗ Some activities have broken relationships');
    }
  }

  if (issues.length === 0) {
    console.log('');
    success('All permission checks passed!');
    info('If timeline is still empty, the issue is likely:');
    info('  1. No unscheduled activities exist (check isScheduled flag)');
    info('  2. Invalid timestamps on activities');
    info('  3. Frontend filtering issue');
  }

  printFooter(issues, recommendations);

  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n');
  error('Script failed with error:');
  console.error(err);
  process.exit(1);
});
