#!/usr/bin/env bun

/**
 * Diagnostic script to debug Today's Summary activity counts
 * This script queries activities from the database and analyzes the type mapping
 *
 * Usage:
 *   infisical run --env=dev -- bun run packages/db/scripts/debug-today-summary.ts [babyId]
 *
 * If babyId is not provided, it will use the most recent baby.
 */

import { startOfDay } from 'date-fns';
import { desc, eq } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/schema';

const { Activities, Babies } = schema;

// Database connection
const POSTGRES_URL = process.env.POSTGRES_URL;

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL environment variable is required');
  console.log(
    '💡 Run with: infisical run --env=dev -- bun run packages/db/scripts/debug-today-summary.ts',
  );
  process.exit(1);
}

const queryClient = postgres(POSTGRES_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 10,
});

const db = drizzle(queryClient, { schema });

/**
 * Current (broken) mapping function from the UI
 */
function currentMapActivityTypeToCategory(type: string): string {
  if (type === 'bottle' || type === 'nursing') return 'feeding';
  return type;
}

/**
 * Fixed mapping function
 */
function fixedMapActivityTypeToCategory(type: string): string {
  // Feeding variants
  if (type === 'feeding' || type === 'bottle' || type === 'nursing') {
    return 'feeding';
  }
  // Diaper variants
  if (
    type === 'diaper' ||
    type === 'wet' ||
    type === 'dirty' ||
    type === 'both'
  ) {
    return 'diaper';
  }
  // Tummy time conversion (underscore to dash)
  if (type === 'tummy_time') {
    return 'tummy-time';
  }
  // Everything else passes through
  return type;
}

/**
 * Aggregate activities by category
 */
function aggregateActivities(
  activities: Array<{
    type: string;
    amount: number | null;
    duration: number | null;
  }>,
  mapFn: (type: string) => string,
): Record<
  string,
  { count: number; totalAmount: number; totalDuration: number }
> {
  return activities.reduce(
    (acc, activity) => {
      const category = mapFn(activity.type);
      if (!acc[category]) {
        acc[category] = {
          count: 1,
          totalAmount: activity.amount || 0,
          totalDuration: activity.duration || 0,
        };
      } else {
        acc[category].count += 1;
        acc[category].totalDuration += activity.duration || 0;
        acc[category].totalAmount += activity.amount || 0;
      }
      return acc;
    },
    {} as Record<
      string,
      { count: number; totalAmount: number; totalDuration: number }
    >,
  );
}

/**
 * Main diagnostic function
 */
async function diagnose() {
  try {
    console.log("🔍 Today's Summary Activity Diagnostic\n");
    console.log('='.repeat(70));

    // Get babyId from command line or find most recent
    let babyId = process.argv[2];

    if (!babyId) {
      console.log('📋 No babyId provided, finding most recent baby...\n');
      const baby = await db.query.Babies.findFirst({
        orderBy: [desc(Babies.createdAt)],
      });

      if (!baby) {
        console.error('❌ No babies found in database');
        process.exit(1);
      }

      babyId = baby.id;
      console.log(
        `✅ Found baby: ${baby.firstName} ${baby.lastName || ''} (${baby.id})`,
      );
      console.log('='.repeat(70));
    } else {
      console.log(`✅ Using provided babyId: ${babyId}`);
      console.log('='.repeat(70));
    }

    // Query today's activities
    const todayStart = startOfDay(new Date());
    console.log(
      `\n📅 Querying activities since: ${todayStart.toISOString()}\n`,
    );

    const activities = await db.query.Activities.findMany({
      limit: 100,
      orderBy: [desc(Activities.startTime)],
      where: eq(Activities.babyId, babyId),
    });

    // Filter to today only
    const todayActivities = activities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= todayStart;
    });

    console.log(`📊 Total activities in DB for baby: ${activities.length}`);
    console.log(`📊 Activities today: ${todayActivities.length}\n`);
    console.log('='.repeat(70));

    if (todayActivities.length === 0) {
      console.log('⚠️  No activities found for today');
      console.log('💡 Try creating some test activities in the app');
      return;
    }

    // Show raw activity types
    console.log('\n📝 Raw Activity Types from Database:\n');
    const typeCounts = todayActivities.reduce(
      (acc, activity) => {
        acc[activity.type] = (acc[activity.type] || 0) + 1;
        return acc;
      },
      {} as Record<string, number>,
    );

    for (const [type, count] of Object.entries(typeCounts)) {
      console.log(`  ${type.padEnd(20)} → ${count} activity(ies)`);
    }

    console.log(`\n${'='.repeat(70)}`);

    // Show current (broken) mapping
    console.log('\n❌ CURRENT (BROKEN) MAPPING:\n');
    const currentAggregation = aggregateActivities(
      todayActivities,
      currentMapActivityTypeToCategory,
    );

    const displayCategories = [
      'feeding',
      'sleep',
      'diaper',
      'tummy-time',
      'pumping',
    ];

    for (const category of displayCategories) {
      const summary = currentAggregation[category] || {
        count: 0,
        totalAmount: 0,
        totalDuration: 0,
      };
      let display = `  ${category.padEnd(20)} → ${summary.count} count`;
      if (summary.totalAmount > 0)
        display += `, ${summary.totalAmount}ml total`;
      if (summary.totalDuration > 0)
        display += `, ${summary.totalDuration}min total`;
      console.log(display);
    }

    console.log(`\n${'='.repeat(70)}`);

    // Show fixed mapping
    console.log('\n✅ FIXED MAPPING:\n');
    const fixedAggregation = aggregateActivities(
      todayActivities,
      fixedMapActivityTypeToCategory,
    );

    for (const category of displayCategories) {
      const summary = fixedAggregation[category] || {
        count: 0,
        totalAmount: 0,
        totalDuration: 0,
      };
      let display = `  ${category.padEnd(20)} → ${summary.count} count`;
      if (summary.totalAmount > 0)
        display += `, ${summary.totalAmount}ml total`;
      if (summary.totalDuration > 0)
        display += `, ${summary.totalDuration}min total`;
      console.log(display);
    }

    console.log(`\n${'='.repeat(70)}`);

    // Show mapping details for each type
    console.log('\n🔄 Type Mapping Analysis:\n');
    for (const type of Object.keys(typeCounts)) {
      const current = currentMapActivityTypeToCategory(type);
      const fixed = fixedMapActivityTypeToCategory(type);
      const status = current === fixed ? '✅' : '🔧';
      console.log(
        `  ${status} "${type}" → Current: "${current}", Fixed: "${fixed}"`,
      );
    }

    console.log(`\n${'='.repeat(70)}`);

    // Summary
    const currentTotal = Object.values(currentAggregation).reduce(
      (sum, s) => sum + s.count,
      0,
    );
    const fixedTotal = Object.values(fixedAggregation).reduce(
      (sum, s) => sum + s.count,
      0,
    );
    const displayedCurrent = displayCategories.reduce(
      (sum, cat) => sum + (currentAggregation[cat]?.count || 0),
      0,
    );
    const displayedFixed = displayCategories.reduce(
      (sum, cat) => sum + (fixedAggregation[cat]?.count || 0),
      0,
    );

    console.log('\n📈 Summary:\n');
    console.log(
      `  Total activities today:                 ${todayActivities.length}`,
    );
    console.log(`  Activities mapped (current):            ${currentTotal}`);
    console.log(`  Activities mapped (fixed):              ${fixedTotal}`);
    console.log(
      `  Activities displayed in UI (current):   ${displayedCurrent}`,
    );
    console.log(`  Activities displayed in UI (fixed):     ${displayedFixed}`);
    console.log(
      `  Missing from display (current):         ${todayActivities.length - displayedCurrent}`,
    );
    console.log(
      `  Missing from display (fixed):           ${todayActivities.length - displayedFixed}`,
    );

    if (displayedCurrent < todayActivities.length) {
      console.log(
        '\n⚠️  Issue confirmed: Activities are not being properly categorized!',
      );
      console.log(
        '💡 Fix: Update mapActivityTypeToCategory function in today-summary-card.tsx',
      );
    } else {
      console.log('\n✅ All activities are properly categorized');
    }

    console.log(`\n${'='.repeat(70)}`);
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  } finally {
    // Close database connection
    await queryClient.end();
  }
}

// Run the diagnostic
diagnose().catch((error) => {
  console.error('\n💥 Fatal error:', error);
  process.exit(1);
});
