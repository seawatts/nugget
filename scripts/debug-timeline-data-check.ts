#!/usr/bin/env bun

/**
 * Timeline Diagnostic Script 1: Data Existence Check
 *
 * This script checks if the basic data exists in the database:
 * - Baby record
 * - Activities (scheduled vs unscheduled)
 * - Milestones (achieved vs pending)
 * - Chats with messages
 *
 * Usage:
 *   infisical run -- bun scripts/debug-timeline-data-check.ts [babyId]
 */

import { desc, eq } from 'drizzle-orm';
import {
  Activities,
  db,
  error,
  formatDate,
  getActivityCounts,
  getBabyDetails,
  getBabyIdFromArgs,
  getChatCounts,
  getMilestoneCounts,
  info,
  isValidTimestamp,
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
    'Timeline Data Existence Check',
    `Checking if data exists for baby: ${babyId}`,
  );

  const issues: string[] = [];
  const recommendations: string[] = [];

  // Step 1: Test database connection
  section('Step 1: Database Connection');
  const dbConnected = await testDatabaseConnection();
  if (dbConnected) {
    success('Database connection successful');
  } else {
    error('Failed to connect to database');
    issues.push('Database connection failed');
    recommendations.push(
      'Check your database connection settings and Infisical configuration',
    );
    printFooter(issues, recommendations);
    process.exit(1);
  }

  // Step 2: Check baby record
  section('Step 2: Baby Record Check');
  const baby = await getBabyDetails(babyId);

  if (!baby) {
    error(`Baby with ID "${babyId}" not found`);
    issues.push('Baby record does not exist');
    recommendations.push(
      'Verify the baby ID is correct. Use a different baby ID or create test data.',
    );
    printFooter(issues, recommendations);
    process.exit(1);
  }

  success(`Baby found: ${baby.firstName} ${baby.lastName || ''}`);
  console.log('');
  tableRow('Baby ID', baby.id);
  tableRow('Name', `${baby.firstName} ${baby.lastName || ''}`.trim());
  tableRow('Family ID', baby.familyId || 'N/A');
  tableRow('Birth Date', formatDate(baby.birthDate));
  tableRow('Created At', formatDate(baby.createdAt));

  if (!baby.family) {
    warning('Baby has no associated family');
    issues.push('Baby is not linked to a family');
    recommendations.push('Link the baby to a family in the database');
  } else {
    success(`Family: ${baby.family.name}`);
    info(`Family members: ${baby.family.familyMembers?.length || 0}`);

    if (baby.family.familyMembers && baby.family.familyMembers.length > 0) {
      console.log('\n  Family Members:');
      for (const member of baby.family.familyMembers) {
        const user = member.user;
        if (user) {
          console.log(
            `    - ${user.firstName || ''} ${user.lastName || ''} (${user.email})`,
          );
        }
      }
    }
  }

  // Step 3: Check activities
  section('Step 3: Activities Check');
  const activityData = await getActivityCounts(babyId);

  console.log('');
  tableRow('Total Activities', activityData.total);
  tableRow('Unscheduled (Timeline)', activityData.unscheduled);
  tableRow('Scheduled (Future)', activityData.scheduled);
  tableRow('Invalid Dates', activityData.withInvalidDates);

  if (activityData.total === 0) {
    error('No activities found for this baby');
    issues.push('No activities exist in the database');
    recommendations.push(
      'Create some test activities for this baby to see them in the timeline',
    );
  } else if (activityData.unscheduled === 0) {
    warning(
      'No unscheduled activities found (timeline only shows unscheduled)',
    );
    issues.push('All activities are marked as scheduled');
    recommendations.push(
      'Set isScheduled=false on activities that should appear in timeline',
    );
  } else {
    success(
      `Found ${activityData.unscheduled} unscheduled activities for timeline`,
    );
  }

  if (activityData.withInvalidDates > 0) {
    warning(
      `${activityData.withInvalidDates} activities have invalid timestamps`,
    );
    issues.push('Some activities have invalid date/time values');
    recommendations.push('Fix or remove activities with invalid dates');
  }

  // Show sample activities
  if (activityData.unscheduled > 0) {
    console.log('\n  Sample Activities (most recent 5):');
    const recentActivities = await db.query.Activities.findMany({
      limit: 5,
      orderBy: [desc(Activities.startTime)],
      where: eq(Activities.babyId, babyId),
      with: {
        user: true,
      },
    });

    for (const activity of recentActivities.filter((a) => !a.isScheduled)) {
      const validDate = isValidTimestamp(activity.startTime);
      const dateStr = formatDate(activity.startTime);
      const status = validDate ? '✓' : '✗';
      const userName = activity.user
        ? `${activity.user.firstName || ''} ${activity.user.lastName || ''}`.trim()
        : 'Unknown';

      console.log(
        `    ${status} ${activity.type.padEnd(15)} | ${dateStr} | ${userName}`,
      );

      if (!validDate) {
        warning('      ^ Invalid timestamp detected');
      }

      if (activity.duration) {
        console.log(`      Duration: ${activity.duration} minutes`);
      }
      if (activity.amountMl) {
        console.log(`      Amount: ${activity.amountMl} ml`);
      }
      if (activity.notes) {
        console.log(
          `      Notes: ${activity.notes.substring(0, 50)}${activity.notes.length > 50 ? '...' : ''}`,
        );
      }
    }
  }

  // Step 4: Check milestones
  section('Step 4: Milestones Check');
  const milestoneData = await getMilestoneCounts(babyId);

  console.log('');
  tableRow('Total Milestones', milestoneData.total);
  tableRow('Achieved (Timeline)', milestoneData.achieved);
  tableRow('Pending', milestoneData.pending);
  tableRow('Invalid Dates', milestoneData.withInvalidDates);

  if (milestoneData.total === 0) {
    info('No milestones found (this is OK)');
  } else if (milestoneData.achieved === 0) {
    info('No achieved milestones (timeline only shows achieved)');
  } else {
    success(`Found ${milestoneData.achieved} achieved milestones for timeline`);
  }

  if (milestoneData.withInvalidDates > 0) {
    warning(
      `${milestoneData.withInvalidDates} milestones have invalid timestamps`,
    );
    issues.push('Some milestones have invalid date/time values');
    recommendations.push('Fix or remove milestones with invalid dates');
  }

  // Step 5: Check chats
  section('Step 5: Chats Check');
  const chatData = await getChatCounts(babyId);

  console.log('');
  tableRow('Total Chats', chatData.total);
  tableRow('Chats with Messages', chatData.withMessages);
  tableRow('Invalid Dates', chatData.withInvalidDates);

  if (chatData.total === 0) {
    info('No chats found (this is OK)');
  } else if (chatData.withMessages === 0) {
    info('No chats with messages (timeline needs first message)');
  } else {
    success(`Found ${chatData.withMessages} chats with messages for timeline`);
  }

  if (chatData.withInvalidDates > 0) {
    warning(`${chatData.withInvalidDates} chats have invalid timestamps`);
    issues.push('Some chats have invalid date/time values');
    recommendations.push('Fix or remove chats with invalid dates');
  }

  // Final summary
  section('Step 6: Timeline Item Count Summary');
  const timelineItemCount =
    activityData.unscheduled + milestoneData.achieved + chatData.withMessages;

  console.log('');
  info(`Expected Timeline Items: ${timelineItemCount}`);
  console.log('  Breakdown:');
  tableRow('Activities (unscheduled)', activityData.unscheduled, 35);
  tableRow('Milestones (achieved)', milestoneData.achieved, 35);
  tableRow('Chats (with messages)', chatData.withMessages, 35);

  if (timelineItemCount === 0) {
    error('No items available for timeline display');
    issues.push('Timeline has no items to display');
    recommendations.push(
      'Add unscheduled activities, achieved milestones, or chats to see timeline items',
    );
  } else {
    success(
      `Timeline should show ${timelineItemCount} items (if no other issues exist)`,
    );
  }

  printFooter(issues, recommendations);

  // Exit with appropriate code
  process.exit(issues.length > 0 ? 1 : 0);
}

main().catch((err) => {
  console.error('\n');
  error('Script failed with error:');
  console.error(err);
  process.exit(1);
});
