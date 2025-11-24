#!/usr/bin/env bun

/**
 * Timeline Diagnostic Script 2: Server Action Logic Simulation
 *
 * This script replicates the exact logic from getActivitiesAction to identify
 * where items might be filtered out or queries might fail.
 *
 * It tests:
 * - Activity queries with isScheduled filter
 * - Milestone queries with achievedDate filter
 * - Chat queries with first message lookup
 * - Date validation and timestamp conversion
 * - Sorting and pagination
 * - Filter application
 *
 * Usage:
 *   infisical run -- bun scripts/debug-timeline-action-logic.ts [babyId]
 */

import { and, asc, desc, eq, inArray, isNotNull, lt } from 'drizzle-orm';
import {
  Activities,
  ChatMessages,
  Chats,
  db,
  error,
  formatDate,
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

// Type definitions matching the server action
type TimelineActivity = {
  type: 'activity';
  data: typeof Activities.$inferSelect & {
    user?: {
      id: string;
      firstName: string | null;
      lastName: string | null;
      avatarUrl: string | null;
      email: string;
    } | null;
  };
  timestamp: Date;
};

type TimelineMilestone = {
  type: 'milestone';
  data: typeof Milestones.$inferSelect;
  timestamp: Date;
};

type TimelineChatMessage = {
  type: 'chat';
  data: typeof ChatMessages.$inferSelect & {
    chat: typeof Chats.$inferSelect;
  };
  timestamp: Date;
};

type TimelineItem = TimelineActivity | TimelineMilestone | TimelineChatMessage;

async function simulateGetActivitiesAction(
  babyId: string,
  familyId: string,
  options: {
    itemTypes?: Array<'activity' | 'milestone' | 'chat'>;
    activityTypes?: string[];
    userIds?: string[];
    limit?: number;
    cursor?: string | null;
  } = {},
) {
  const {
    itemTypes,
    activityTypes,
    userIds,
    limit = 30,
    cursor = null,
  } = options;

  console.log('\nQuery Parameters:');
  tableRow('Baby ID', babyId);
  tableRow('Family ID', familyId);
  tableRow('Item Types', itemTypes?.join(', ') || 'all');
  tableRow('Activity Types', activityTypes?.join(', ') || 'all');
  tableRow('User IDs', userIds?.join(', ') || 'all');
  tableRow('Limit', limit);
  tableRow('Cursor', cursor || 'none');

  const cursorDate = cursor ? new Date(cursor) : null;

  // Determine which types to fetch
  const shouldFetchActivities = !itemTypes || itemTypes.includes('activity');
  const shouldFetchMilestones = !itemTypes || itemTypes.includes('milestone');
  const shouldFetchChats = !itemTypes || itemTypes.includes('chat');

  const allItems: TimelineItem[] = [];
  const fetchLimit = Math.min(limit * 3, 1000);

  // Fetch activities (mimics server action logic)
  if (shouldFetchActivities) {
    info('\nFetching activities...');

    const activityConditions = [
      eq(Activities.babyId, babyId),
      eq(Activities.isScheduled, false),
    ];

    if (cursorDate) {
      activityConditions.push(lt(Activities.startTime, cursorDate));
    }

    if (activityTypes && activityTypes.length > 0) {
      activityConditions.push(
        inArray(
          Activities.type,
          activityTypes as (typeof Activities.$inferSelect.type)[],
        ),
      );
    }

    if (userIds && userIds.length > 0) {
      activityConditions.push(inArray(Activities.userId, userIds));
    }

    console.log('  Query conditions:');
    console.log(`    - babyId = ${babyId}`);
    console.log('    - isScheduled = false');
    if (cursorDate) console.log(`    - startTime < ${formatDate(cursorDate)}`);
    if (activityTypes?.length)
      console.log(`    - type IN [${activityTypes.join(', ')}]`);
    if (userIds?.length) console.log(`    - userId IN [${userIds.join(', ')}]`);

    const activities = await db.query.Activities.findMany({
      limit: fetchLimit,
      orderBy: desc(Activities.startTime),
      where: and(...activityConditions),
      with: {
        user: true,
      },
    });

    console.log(`  Raw query returned: ${activities.length} activities`);

    // Filter and transform activities (mimics server action logic)
    const validActivities = activities.filter((activity) => {
      if (!activity.startTime) {
        warning(`    Filtered out activity ${activity.id}: no startTime`);
        return false;
      }

      const timestamp =
        activity.startTime instanceof Date
          ? activity.startTime
          : new Date(activity.startTime);

      if (Number.isNaN(timestamp.getTime())) {
        warning(`    Filtered out activity ${activity.id}: invalid timestamp`);
        return false;
      }

      return true;
    });

    console.log(
      `  After filtering: ${validActivities.length} valid activities`,
    );

    if (validActivities.length > 0) {
      const first = validActivities[0];
      const last = validActivities.at(-1);
      console.log(
        `  Date range: ${formatDate(last?.startTime)} to ${formatDate(first?.startTime)}`,
      );
    }

    allItems.push(
      ...validActivities.map(
        (activity): TimelineActivity => ({
          data: activity,
          timestamp:
            activity.startTime instanceof Date
              ? activity.startTime
              : new Date(activity.startTime),
          type: 'activity',
        }),
      ),
    );
  }

  // Fetch milestones (mimics server action logic)
  if (shouldFetchMilestones) {
    info('\nFetching milestones...');

    const milestoneConditions = [
      eq(Milestones.babyId, babyId),
      isNotNull(Milestones.achievedDate),
    ];

    if (cursorDate) {
      milestoneConditions.push(lt(Milestones.achievedDate, cursorDate));
    }

    console.log('  Query conditions:');
    console.log(`    - babyId = ${babyId}`);
    console.log('    - achievedDate IS NOT NULL');
    if (cursorDate)
      console.log(`    - achievedDate < ${formatDate(cursorDate)}`);

    const milestones = await db.query.Milestones.findMany({
      limit: fetchLimit,
      orderBy: desc(Milestones.achievedDate),
      where: and(...milestoneConditions),
    });

    console.log(`  Raw query returned: ${milestones.length} milestones`);

    // Filter and transform milestones (mimics server action logic)
    const validMilestones = milestones.filter((milestone) => {
      const achievedDate = milestone.achievedDate;
      if (!achievedDate) {
        warning(`    Filtered out milestone ${milestone.id}: no achievedDate`);
        return false;
      }

      const timestamp =
        achievedDate instanceof Date ? achievedDate : new Date(achievedDate);

      if (Number.isNaN(timestamp.getTime())) {
        warning(
          `    Filtered out milestone ${milestone.id}: invalid timestamp`,
        );
        return false;
      }

      return true;
    });

    console.log(
      `  After filtering: ${validMilestones.length} valid milestones`,
    );

    if (validMilestones.length > 0) {
      const first = validMilestones[0];
      const last = validMilestones.at(-1);
      console.log(
        `  Date range: ${formatDate(last?.achievedDate)} to ${formatDate(first?.achievedDate)}`,
      );
    }

    allItems.push(
      ...validMilestones.map((milestone): TimelineMilestone => {
        const achievedDate = milestone.achievedDate;
        // achievedDate is guaranteed to be non-null due to filtering
        const timestamp =
          achievedDate instanceof Date
            ? achievedDate
            : new Date(achievedDate ?? new Date());

        return {
          data: milestone,
          timestamp,
          type: 'milestone',
        };
      }),
    );
  }

  // Fetch chats (mimics server action logic)
  if (shouldFetchChats) {
    info('\nFetching chats...');

    const chatConditions = [eq(Chats.babyId, babyId)];

    if (cursorDate) {
      chatConditions.push(lt(Chats.createdAt, cursorDate));
    }

    console.log('  Query conditions:');
    console.log(`    - babyId = ${babyId}`);
    if (cursorDate) console.log(`    - createdAt < ${formatDate(cursorDate)}`);

    const chats = await db.query.Chats.findMany({
      limit: fetchLimit,
      orderBy: desc(Chats.createdAt),
      where: and(...chatConditions),
    });

    console.log(`  Raw query returned: ${chats.length} chats`);

    // Get first message for each chat (mimics server action logic)
    const firstMessages = await Promise.all(
      chats.map(async (chat) => {
        const firstMessage = await db.query.ChatMessages.findFirst({
          orderBy: asc(ChatMessages.createdAt),
          where: eq(ChatMessages.chatId, chat.id),
        });

        if (firstMessage) {
          return {
            ...firstMessage,
            chat,
          };
        }
        return null;
      }),
    );

    const validMessages = firstMessages.filter((msg) => msg !== null);
    console.log(`  Chats with first messages: ${validMessages.length}`);

    // Filter and transform chat messages (mimics server action logic)
    const validChatMessages = validMessages.filter((message) => {
      if (!message) return false;

      const timestamp =
        message.createdAt instanceof Date
          ? message.createdAt
          : new Date(message.createdAt);

      if (Number.isNaN(timestamp.getTime())) {
        warning(
          `    Filtered out chat message ${message.id}: invalid timestamp`,
        );
        return false;
      }

      return true;
    });

    console.log(
      `  After filtering: ${validChatMessages.length} valid chat messages`,
    );

    if (validChatMessages.length > 0) {
      const first = validChatMessages[0];
      const last = validChatMessages.at(-1);
      console.log(
        `  Date range: ${formatDate(last?.createdAt)} to ${formatDate(first?.createdAt)}`,
      );
    }

    allItems.push(
      ...validChatMessages.map((message): TimelineChatMessage => {
        const timestamp =
          message.createdAt instanceof Date
            ? message.createdAt
            : new Date(message.createdAt);

        return {
          data: message as typeof ChatMessages.$inferSelect & {
            chat: typeof Chats.$inferSelect;
          },
          timestamp,
          type: 'chat',
        };
      }),
    );
  }

  // Sort all items by timestamp (mimics server action logic)
  info('\nSorting and paginating...');
  allItems.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());

  console.log(`  Total items before pagination: ${allItems.length}`);

  // Apply pagination
  const paginatedItems = allItems.slice(0, limit);

  console.log(
    `  Items after pagination (limit=${limit}): ${paginatedItems.length}`,
  );

  // Determine next cursor
  const lastItem = paginatedItems.at(-1);
  const nextCursor =
    paginatedItems.length === limit && lastItem
      ? lastItem.timestamp.toISOString()
      : null;

  if (nextCursor) {
    info(`  Next cursor: ${nextCursor}`);
  } else {
    info('  No more pages available');
  }

  return {
    items: paginatedItems,
    nextCursor,
    totalBeforePagination: allItems.length,
  };
}

async function main() {
  const babyId = getBabyIdFromArgs();

  printHeader(
    'Timeline Action Logic Simulation',
    `Simulating getActivitiesAction for baby: ${babyId}`,
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

  // Get baby details
  section('Baby Details');
  const baby = await getBabyDetails(babyId);

  if (!baby) {
    error(`Baby with ID "${babyId}" not found`);
    process.exit(1);
  }

  if (!baby.family) {
    error('Baby has no associated family');
    process.exit(1);
  }

  success(`Baby: ${baby.firstName} ${baby.lastName || ''}`);
  success(`Family: ${baby.family.name} (${baby.familyId})`);

  // Test 1: Default query (no filters)
  section('Test 1: Default Query (No Filters)');
  const result1 = await simulateGetActivitiesAction(babyId, baby.familyId, {});

  console.log('\nResults:');
  tableRow('Total Items (pre-pagination)', result1.totalBeforePagination);
  tableRow('Returned Items', result1.items.length);
  tableRow('Has Next Page', result1.nextCursor ? 'Yes' : 'No');

  if (result1.items.length === 0) {
    error('No items returned from default query');
    issues.push('Default query returns no items');

    if (result1.totalBeforePagination === 0) {
      recommendations.push('No valid timeline items exist in the database');
    } else {
      recommendations.push(
        'Items were filtered out during pagination (should not happen)',
      );
    }
  } else {
    success(`Successfully retrieved ${result1.items.length} items`);

    // Show breakdown by type
    const breakdown = result1.items.reduce(
      (acc, item) => {
        acc[item.type] = (acc[item.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    console.log('\nItem Type Breakdown:');
    for (const [type, count] of Object.entries(breakdown)) {
      tableRow(`  ${type}`, count, 25);
    }

    // Show sample items
    console.log('\nSample Items (first 5):');
    for (const item of result1.items.slice(0, 5)) {
      let label = '';
      if (item.type === 'activity') {
        label = `${item.data.type} - ${formatDate(item.timestamp)}`;
      } else if (item.type === 'milestone') {
        label = `${item.data.title} - ${formatDate(item.timestamp)}`;
      } else if (item.type === 'chat') {
        label = `Chat - ${formatDate(item.timestamp)}`;
      }
      console.log(`  • ${item.type.padEnd(10)} : ${label}`);
    }
  }

  // Test 2: Activity-only filter
  section('Test 2: Filter - Activities Only');
  const result2 = await simulateGetActivitiesAction(babyId, baby.familyId, {
    itemTypes: ['activity'],
  });

  console.log('\nResults:');
  tableRow('Returned Items', result2.items.length);

  if (result2.items.length === 0 && result1.totalBeforePagination > 0) {
    warning('Activity filter removed all items (but other types exist)');
  }

  // Test 3: Specific activity types
  if (result2.items.length > 0) {
    section('Test 3: Filter - Specific Activity Types (sleep, feeding)');
    const result3 = await simulateGetActivitiesAction(babyId, baby.familyId, {
      activityTypes: ['sleep', 'nursing', 'bottle'],
      itemTypes: ['activity'],
    });

    console.log('\nResults:');
    tableRow('Returned Items', result3.items.length);

    if (result3.items.length === 0 && result2.items.length > 0) {
      warning('Activity type filter removed all items (but activities exist)');
      info('This means no sleep or feeding activities exist');
    }
  }

  // Test 4: Pagination
  if (result1.items.length >= 30) {
    section('Test 4: Pagination - Fetch Second Page');
    const result4 = await simulateGetActivitiesAction(babyId, baby.familyId, {
      cursor: result1.nextCursor,
      limit: 30,
    });

    console.log('\nResults:');
    tableRow('Second Page Items', result4.items.length);
    tableRow('Has Third Page', result4.nextCursor ? 'Yes' : 'No');

    if (result4.items.length > 0) {
      success('Pagination working correctly');
    }
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
