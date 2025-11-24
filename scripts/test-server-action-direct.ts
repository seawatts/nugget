#!/usr/bin/env bun

/**
 * Test calling the getActivitiesAction directly to see what it returns
 * This mimics what the frontend would receive
 */

import { getActivitiesAction } from '../apps/web-app/src/app/(app)/app/_components/activities/timeline/activity-timeline.actions';

async function main() {
  const babyId = 'baby_a2wr6cnjrxinbe6m0ihgnvef';

  console.log('Testing getActivitiesAction directly...\n');
  console.log(`Baby ID: ${babyId}`);
  console.log('Filters: none (default query)\n');

  try {
    const result = await getActivitiesAction({
      babyId,
      limit: 30,
    });

    if (result?.data) {
      console.log('✓ Server action succeeded\n');
      console.log(`Items returned: ${result.data.items.length}`);
      console.log(`Next cursor: ${result.data.nextCursor || 'none'}\n`);

      if (result.data.items.length > 0) {
        console.log('Sample items:');
        for (const item of result.data.items.slice(0, 5)) {
          console.log(`  • ${item.type}: ${item.timestamp.toISOString()}`);
        }
      } else {
        console.log('❌ No items returned!');
      }
    } else {
      console.log('❌ Server action failed');
      console.log('Error:', result);
    }
  } catch (error) {
    console.log('❌ Exception thrown:');
    console.error(error);
  }
}

main().catch(console.error);
