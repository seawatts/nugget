#!/usr/bin/env bun

/**
 * Diagnostic script to inspect the raw data powering the sleep prediction card.
 *
 * Usage:
 *   infisical run -- bun run packages/db/scripts/debug-sleep-prediction.ts [babyId]
 *
 * If babyId is omitted, the script will use the most recently created baby.
 */

import { formatDistanceToNow } from 'date-fns';
import { desc, eq, gte } from 'drizzle-orm';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';
import * as schema from '../src/schema';

const { Activities, Babies } = schema;

const POSTGRES_URL = process.env.POSTGRES_URL;
const LOOKBACK_HOURS = Number(process.env.SLEEP_DEBUG_HOURS ?? '72');

if (!POSTGRES_URL) {
  console.error('❌ POSTGRES_URL environment variable is required');
  console.log(
    '💡 Run with: infisical run --env=dev -- bun run packages/db/scripts/debug-sleep-prediction.ts',
  );
  process.exit(1);
}

const queryClient = postgres(POSTGRES_URL, {
  connect_timeout: 10,
  idle_timeout: 20,
  max: 10,
});

const db = drizzle(queryClient, { schema });

function formatDate(value: Date | null): string {
  if (!value) return '—';
  return `${value.toISOString()} (${formatDistanceToNow(value, { addSuffix: true })})`;
}

async function debugSleepPrediction() {
  try {
    console.log('🛌 Sleep Prediction Diagnostic');
    console.log('='.repeat(70));

    let babyId = process.argv[2];

    if (!babyId) {
      console.log('📋 No babyId provided, finding most recent baby…\n');
      const baby = await db.query.Babies.findFirst({
        orderBy: [desc(Babies.createdAt)],
      });

      if (!baby) {
        console.error('❌ No babies found in database');
        process.exit(1);
      }

      babyId = baby.id;
      console.log(
        `✅ Using baby ${baby.firstName ?? ''} ${baby.lastName ?? ''} (${baby.id})`,
      );
    } else {
      console.log(`✅ Using provided babyId: ${babyId}`);
    }

    console.log('='.repeat(70));

    const lookbackStart = new Date();
    lookbackStart.setHours(lookbackStart.getHours() - LOOKBACK_HOURS);

    console.log(
      `🔎 Fetching sleep activities since ${lookbackStart.toISOString()} (last ${LOOKBACK_HOURS}h)\n`,
    );

    if (!babyId) {
      console.error(
        '❌ Unable to resolve a babyId. Provide --babyId or ensure a baby exists.',
      );
      process.exit(1);
    }

    const activities = await db.query.Activities.findMany({
      limit: 200,
      orderBy: [desc(Activities.startTime)],
      where: (fields, { and }) =>
        and(
          eq(fields.babyId, babyId),
          eq(fields.type, 'sleep'),
          gte(fields.startTime, lookbackStart),
        ),
      with: {
        user: true,
      },
    });

    if (activities.length === 0) {
      console.log('⚠️  No sleep activities found in this window.');
      return;
    }

    console.log(`📊 Found ${activities.length} sleep activities:\n`);
    activities.forEach((activity, index) => {
      const start = new Date(activity.startTime);
      const end = activity.endTime ? new Date(activity.endTime) : null;
      const status = end ? 'completed' : 'in-progress';
      const duration =
        activity.duration ??
        (end ? Math.round((end.getTime() - start.getTime()) / 60000) : null);

      console.log(
        [
          `${(index + 1).toString().padStart(2, '0')}. ${status.toUpperCase()}`,
          `   id: ${activity.id}`,
          `   start: ${formatDate(start)}`,
          `   end:   ${formatDate(end)}`,
          `   duration: ${duration !== null ? `${duration} min` : '—'}`,
          `   user: ${activity.user?.firstName ?? activity.user?.email ?? '—'}`,
          `   notes: ${activity.notes ?? '—'}`,
        ].join('\n'),
      );
      console.log('-'.repeat(70));
    });

    const inProgress = activities.find((activity) => activity.endTime === null);
    if (inProgress) {
      console.log('⏱️  In-progress sleep detected:');
      console.log(`   id: ${inProgress.id}`);
      console.log(`   started: ${formatDate(new Date(inProgress.startTime))}`);
      console.log('-'.repeat(70));
    } else {
      console.log(
        '✅ No in-progress sleeps detected within the lookback window.',
      );
    }
  } catch (error) {
    console.error('\n💥 Fatal error:', error);
    process.exit(1);
  } finally {
    await queryClient.end();
  }
}

debugSleepPrediction();
