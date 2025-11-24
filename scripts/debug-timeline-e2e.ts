#!/usr/bin/env bun

/**
 * Timeline Diagnostic Script 4: End-to-End Master Diagnostic
 *
 * This master script runs all diagnostic checks in sequence and generates
 * a comprehensive report with specific recommendations.
 *
 * Usage:
 *   infisical run -- bun scripts/debug-timeline-e2e.ts [babyId]
 */

import { and, desc, eq, isNotNull } from 'drizzle-orm';
import {
  Activities,
  Chats,
  colors,
  db,
  error,
  formatDate,
  getActivityCounts,
  getBabyDetails,
  getBabyIdFromArgs,
  getChatCounts,
  getMilestoneCounts,
  info,
  log,
  Milestones,
  printHeader,
  section,
  success,
  tableRow,
  testDatabaseConnection,
  warning,
} from './lib/timeline-test-utils.ts';

interface DiagnosticResult {
  category: string;
  passed: boolean;
  message: string;
  details?: string[];
}

async function main() {
  const babyId = getBabyIdFromArgs();
  const results: DiagnosticResult[] = [];

  printHeader(
    'Timeline End-to-End Diagnostic Report',
    `Comprehensive analysis for baby: ${babyId}`,
  );

  // === PHASE 1: Database & Baby Setup ===
  section('Phase 1: Database & Baby Setup');

  // 1.1 Database connection
  const dbConnected = await testDatabaseConnection();
  results.push({
    category: 'Database',
    message: dbConnected
      ? 'Database connection successful'
      : 'Database connection failed',
    passed: dbConnected,
  });

  if (!dbConnected) {
    printReport(results);
    process.exit(1);
  }
  success('✓ Database connected');

  // 1.2 Baby exists
  const baby = await getBabyDetails(babyId);
  results.push({
    category: 'Baby Record',
    details: baby
      ? [
          `ID: ${baby.id}`,
          `Family: ${baby.familyId || 'NOT SET'}`,
          `Birth Date: ${formatDate(baby.birthDate)}`,
        ]
      : [],
    message: baby
      ? `Baby found: ${baby.firstName} ${baby.lastName || ''}`
      : 'Baby not found',
    passed: baby !== undefined && baby !== null,
  });

  if (!baby) {
    printReport(results);
    process.exit(1);
  }
  success(`✓ Baby found: ${baby.firstName}`);

  // 1.3 Family exists
  results.push({
    category: 'Family Record',
    details: baby.family
      ? [
          `ID: ${baby.family.id}`,
          `Members: ${baby.family.familyMembers?.length || 0}`,
        ]
      : [],
    message: baby.family ? `Family: ${baby.family.name}` : 'Family not found',
    passed: baby.family !== undefined && baby.family !== null,
  });

  if (!baby.family) {
    printReport(results);
    process.exit(1);
  }
  success(`✓ Family: ${baby.family.name}`);

  // 1.4 Family has members
  const memberCount = baby.family.familyMembers?.length || 0;
  results.push({
    category: 'Family Members',
    details: baby.family.familyMembers
      ?.map(
        (m) =>
          `${m.user?.firstName || ''} ${m.user?.lastName || ''} (${m.user?.email})`,
      )
      .filter(Boolean),
    message: `${memberCount} family member(s) found`,
    passed: memberCount > 0,
  });

  if (memberCount === 0) {
    error('✗ No family members - no one can access this baby');
    printReport(results);
    process.exit(1);
  }
  success(`✓ ${memberCount} family member(s)`);

  // === PHASE 2: Data Existence ===
  section('Phase 2: Data Existence');

  // 2.1 Activities
  const activityData = await getActivityCounts(babyId);
  results.push({
    category: 'Activities - Total',
    details: [
      `Unscheduled (Timeline): ${activityData.unscheduled}`,
      `Scheduled (Future): ${activityData.scheduled}`,
      `Invalid Dates: ${activityData.withInvalidDates}`,
    ],
    message: `${activityData.total} total activities`,
    passed: activityData.total > 0,
  });

  results.push({
    category: 'Activities - Unscheduled',
    message: `${activityData.unscheduled} unscheduled activities for timeline`,
    passed: activityData.unscheduled > 0,
  });

  results.push({
    category: 'Activities - Date Validity',
    message:
      activityData.withInvalidDates === 0
        ? 'All activities have valid dates'
        : `${activityData.withInvalidDates} activities have invalid dates`,
    passed: activityData.withInvalidDates === 0,
  });

  if (activityData.unscheduled === 0) {
    if (activityData.total > 0) {
      warning(
        '✗ All activities are scheduled - timeline only shows unscheduled',
      );
    } else {
      warning('✗ No activities exist');
    }
  } else {
    success(`✓ ${activityData.unscheduled} unscheduled activities`);
  }

  // 2.2 Milestones
  const milestoneData = await getMilestoneCounts(babyId);
  results.push({
    category: 'Milestones - Total',
    details: [
      `Achieved (Timeline): ${milestoneData.achieved}`,
      `Pending: ${milestoneData.pending}`,
      `Invalid Dates: ${milestoneData.withInvalidDates}`,
    ],
    message: `${milestoneData.total} total milestones`,
    passed: true, // Milestones are optional
  });

  results.push({
    category: 'Milestones - Date Validity',
    message:
      milestoneData.withInvalidDates === 0
        ? 'All milestones have valid dates'
        : `${milestoneData.withInvalidDates} milestones have invalid dates`,
    passed: milestoneData.withInvalidDates === 0,
  });

  info(`ℹ ${milestoneData.achieved} achieved milestones`);

  // 2.3 Chats
  const chatData = await getChatCounts(babyId);
  results.push({
    category: 'Chats',
    details: [
      `Total Chats: ${chatData.total}`,
      `With Messages: ${chatData.withMessages}`,
      `Invalid Dates: ${chatData.withInvalidDates}`,
    ],
    message: `${chatData.withMessages} chats with messages`,
    passed: true, // Chats are optional
  });

  info(`ℹ ${chatData.withMessages} chats with messages`);

  // === PHASE 3: Query Logic ===
  section('Phase 3: Query Logic Simulation');

  // 3.1 Activities query (mimics server action)
  const activitiesQuery = await db.query.Activities.findMany({
    limit: 30,
    orderBy: desc(Activities.startTime),
    where: and(
      eq(Activities.babyId, babyId),
      eq(Activities.isScheduled, false),
    ),
    with: {
      user: true,
    },
  });

  const validActivities = activitiesQuery.filter((a) => {
    if (!a.startTime) return false;
    const date =
      a.startTime instanceof Date ? a.startTime : new Date(a.startTime);
    return !Number.isNaN(date.getTime());
  });

  results.push({
    category: 'Query - Activities',
    details: [
      `Raw query: ${activitiesQuery.length} items`,
      `After validation: ${validActivities.length} items`,
      `Filtered out: ${activitiesQuery.length - validActivities.length} items`,
    ],
    message: `Query returned ${validActivities.length} valid activities`,
    passed: validActivities.length > 0,
  });

  if (validActivities.length > 0) {
    success(`✓ Activities query returns ${validActivities.length} items`);
  } else {
    error('✗ Activities query returns no items');
  }

  // 3.2 Milestones query (mimics server action)
  const milestonesQuery = await db.query.Milestones.findMany({
    limit: 30,
    orderBy: desc(Milestones.achievedDate),
    where: and(
      eq(Milestones.babyId, babyId),
      isNotNull(Milestones.achievedDate),
    ),
  });

  const validMilestones = milestonesQuery.filter((m) => {
    if (!m.achievedDate) return false;
    const date =
      m.achievedDate instanceof Date
        ? m.achievedDate
        : new Date(m.achievedDate);
    return !Number.isNaN(date.getTime());
  });

  results.push({
    category: 'Query - Milestones',
    message: `Query returned ${validMilestones.length} valid milestones`,
    passed: true, // Milestones are optional
  });

  info(`ℹ Milestones query returns ${validMilestones.length} items`);

  // 3.3 Chats query (mimics server action)
  const chatsQuery = await db.query.Chats.findMany({
    limit: 30,
    orderBy: desc(Chats.createdAt),
    where: eq(Chats.babyId, babyId),
    with: {
      messages: {
        limit: 1,
        orderBy: desc(Chats.createdAt),
      },
    },
  });

  const chatsWithMessages = chatsQuery.filter((c) => c.messages.length > 0);

  results.push({
    category: 'Query - Chats',
    message: `Query returned ${chatsWithMessages.length} chats with messages`,
    passed: true, // Chats are optional
  });

  info(`ℹ Chats query returns ${chatsWithMessages.length} items`);

  // === PHASE 4: Final Timeline Count ===
  section('Phase 4: Expected Timeline Result');

  const expectedTimelineCount =
    validActivities.length + validMilestones.length + chatsWithMessages.length;

  results.push({
    category: 'Timeline - Expected Items',
    details: [
      `Activities: ${validActivities.length}`,
      `Milestones: ${validMilestones.length}`,
      `Chats: ${chatsWithMessages.length}`,
    ],
    message: `Timeline should show ${expectedTimelineCount} items`,
    passed: expectedTimelineCount > 0,
  });

  console.log('');
  tableRow('Expected Timeline Items', expectedTimelineCount);
  console.log('  Breakdown:');
  tableRow('  Activities', validActivities.length, 30);
  tableRow('  Milestones', validMilestones.length, 30);
  tableRow('  Chats', chatsWithMessages.length, 30);

  if (expectedTimelineCount > 0) {
    success(`\n✓ Timeline should display ${expectedTimelineCount} items`);

    // Show sample items
    console.log('\nSample Timeline Items (first 5):');
    const allItems = [
      ...validActivities.map((a) => ({
        date: a.startTime,
        label: a.type,
        type: 'activity',
      })),
      ...validMilestones.map((m) => ({
        date: m.achievedDate,
        label: m.title,
        type: 'milestone',
      })),
      ...chatsWithMessages.map((c) => ({
        date: c.createdAt,
        label: 'Chat',
        type: 'chat',
      })),
    ]
      .sort((a, b) => {
        const dateA =
          a.date instanceof Date ? a.date : new Date(a.date ?? new Date());
        const dateB =
          b.date instanceof Date ? b.date : new Date(b.date ?? new Date());
        return dateB.getTime() - dateA.getTime();
      })
      .slice(0, 5);

    for (const item of allItems) {
      console.log(
        `  • ${item.type.padEnd(10)} : ${item.label} - ${formatDate(item.date)}`,
      );
    }
  } else {
    error('\n✗ No items available for timeline display');
  }

  // === FINAL REPORT ===
  printReport(results);

  const hasCriticalFailures = results.some(
    (r) =>
      !r.passed &&
      [
        'Database',
        'Baby Record',
        'Family Record',
        'Family Members',
        'Activities - Unscheduled',
      ].includes(r.category),
  );

  process.exit(hasCriticalFailures ? 1 : 0);
}

function printReport(results: DiagnosticResult[]) {
  section('Diagnostic Report');

  const passed = results.filter((r) => r.passed).length;
  const failed = results.filter((r) => !r.passed).length;

  console.log('');
  log(`Total Checks: ${results.length}`, 'bright');
  if (passed > 0) log(`Passed: ${passed}`, 'green');
  if (failed > 0) log(`Failed: ${failed}`, 'red');

  // Group by category
  const categories = new Set(results.map((r) => r.category.split(' - ')[0]));

  for (const category of categories) {
    const categoryResults = results.filter((r) =>
      r.category.startsWith(category),
    );
    const allPassed = categoryResults.every((r) => r.passed);

    console.log('');
    const icon = allPassed ? '✓' : '✗';
    const color = allPassed ? 'green' : 'red';
    log(`${icon} ${category}`, color);

    for (const result of categoryResults) {
      const indent = '  ';
      const subIcon = result.passed ? '✓' : '✗';
      const subColor = result.passed ? 'green' : 'red';
      console.log(
        `${indent}${colors[subColor]}${subIcon}${colors.reset} ${result.message}`,
      );

      if (result.details && result.details.length > 0) {
        for (const detail of result.details) {
          console.log(`${indent}  ${detail}`);
        }
      }
    }
  }

  // Recommendations
  section('Recommendations');

  const issues = results.filter((r) => !r.passed);

  if (issues.length === 0) {
    success('All checks passed!');
    console.log('');
    info('If the timeline is still not showing items in the browser:');
    console.log('  1. Check browser console for JavaScript errors');
    console.log('  2. Verify auth context (userId, orgId) is correct');
    console.log('  3. Check if filters are applied on the timeline');
    console.log('  4. Clear browser cache and reload');
    console.log('  5. Check network tab for failed API requests');
  } else {
    for (const issue of issues) {
      console.log('');
      error(`Issue: ${issue.category}`);
      console.log(`  ${issue.message}`);

      // Provide specific recommendations based on category
      if (issue.category === 'Activities - Unscheduled') {
        warning(
          '  → Set isScheduled=false on activities to show them in timeline',
        );
        warning('  → Or create new activities with isScheduled=false');
      } else if (issue.category === 'Activities - Date Validity') {
        warning('  → Fix or remove activities with invalid startTime values');
        warning('  → Ensure dates are valid ISO 8601 strings or Date objects');
      } else if (issue.category === 'Family Members') {
        warning('  → Add users to the family via FamilyMembers table');
      } else if (issue.category.includes('Query')) {
        warning('  → Check database indexes for performance');
        warning('  → Verify RLS policies are not blocking queries');
      }
    }
  }
}

main().catch((err) => {
  console.error('\n');
  error('Script failed with error:');
  console.error(err);
  process.exit(1);
});
