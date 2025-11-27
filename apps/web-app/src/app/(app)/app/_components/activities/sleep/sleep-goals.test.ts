import type { Activities } from '@nugget/db/schema';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { getSleepDailyProgress } from '../shared/daily-progress';
import { calculateTodaysSleepStats } from './sleep-goals';

let activityCounter = 0;
const fixedNow = new Date(2024, 0, 1, 12, 0, 0);

function makeDate(hours: number, minutes = 0) {
  return new Date(2024, 0, 1, hours, minutes, 0, 0);
}

function makeSleepActivity(
  overrides: Partial<typeof Activities.$inferSelect>,
): typeof Activities.$inferSelect {
  const startTime = overrides.startTime ?? new Date();
  const id = ++activityCounter;

  const detailsOverrides =
    (overrides.details as
      | (Record<string, unknown> & {
          sleepType?: 'nap' | 'night';
        })
      | undefined) ?? {};
  const { type: _ignoredType, sleepType, ...restDetails } = detailsOverrides;
  const resolvedDetails = {
    ...restDetails,
    sleepType: (sleepType as 'nap' | 'night' | undefined) ?? 'nap',
    type: 'sleep' as const,
  };

  return {
    amountMl: null,
    assignedUserId: null,
    babyId: 'baby',
    createdAt: startTime,
    details: resolvedDetails,
    duration: null,
    endTime: null,
    familyId: 'family',
    familyMemberId: null,
    feedingSource: null,
    id: `sleep-${id}`,
    isScheduled: false,
    notes: null,
    startTime,
    subjectType: 'baby',
    type: 'sleep',
    updatedAt: startTime,
    userId: 'user',
    ...overrides,
  } as typeof Activities.$inferSelect;
}

describe('sleep goals helpers', () => {
  beforeEach(() => {
    activityCounter = 0;
    vi.useFakeTimers({ now: fixedNow });
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('ignores skipped zero-duration sleeps when calculating totals', () => {
    const stats = calculateTodaysSleepStats([
      makeSleepActivity({
        duration: 90,
        startTime: makeDate(8),
      }),
      makeSleepActivity({
        details: { skipped: true, sleepType: 'nap', type: 'sleep' },
        duration: 0,
        startTime: makeDate(9),
      }),
      makeSleepActivity({
        duration: null,
        startTime: makeDate(11, 30),
      }),
    ]);

    expect(stats.sleepCount).toBe(2);
    expect(stats.totalSleepMinutes).toBe(120); // 90 completed + 30 in-progress
    expect(stats.longestSleepMinutes).toBe(90);
  });

  it('treats zero-duration sleeps as completed entries instead of in-progress', () => {
    const activities = [
      makeSleepActivity({
        duration: 60,
        startTime: makeDate(6),
      }),
      makeSleepActivity({
        duration: 0,
        startTime: makeDate(10),
      }),
    ];

    const stats = calculateTodaysSleepStats(activities);
    const progress = getSleepDailyProgress({
      activities,
      babyAgeDays: 120,
    });

    expect(stats.sleepCount).toBe(2); // zero-duration counted but not inflated
    expect(stats.totalSleepMinutes).toBe(60);
    expect(progress?.currentValue).toBe(60);
  });
});
