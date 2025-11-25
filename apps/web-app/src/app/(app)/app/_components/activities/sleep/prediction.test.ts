import type { Activities } from '@nugget/db/schema';
import { describe, expect, it } from 'vitest';

import { predictNextSleep } from './prediction';

type SleepActivity = typeof Activities.$inferSelect;

function buildSleepActivity(
  overrides: Partial<SleepActivity> = {},
): SleepActivity {
  const startTime = overrides.startTime ?? new Date();
  const hasCustomEndTime = Object.hasOwn(overrides, 'endTime');
  const computedEndTime = hasCustomEndTime
    ? (overrides.endTime ?? null)
    : new Date(startTime.getTime() + 60 * 60 * 1000);
  const hasCustomDuration = Object.hasOwn(overrides, 'duration');
  const computedDuration = hasCustomDuration
    ? (overrides.duration ?? null)
    : computedEndTime
      ? Math.round((computedEndTime.getTime() - startTime.getTime()) / 60000)
      : null;

  return {
    amountMl: null,
    assignedUserId: null,
    babyId: overrides.babyId ?? 'baby_123',
    createdAt: overrides.createdAt ?? new Date(),
    details:
      overrides.details ??
      ({
        sleepType: 'nap',
        type: 'sleep',
      } as SleepActivity['details']),
    duration: computedDuration,
    endTime: computedEndTime,
    familyId: overrides.familyId ?? 'family_123',
    familyMemberId: null,
    feedingSource: null,
    id: overrides.id ?? `activity_${Math.random().toString(36).slice(2)}`,
    isScheduled: overrides.isScheduled ?? false,
    notes: overrides.notes ?? null,
    startTime,
    subjectType: overrides.subjectType ?? 'baby',
    type: overrides.type ?? 'sleep',
    updatedAt: overrides.updatedAt ?? new Date(),
    userId: overrides.userId ?? 'user_123',
  };
}

describe('predictNextSleep', () => {
  it('ignores in-progress sleep entries when projecting the next sleep', () => {
    const completedSleep = buildSleepActivity({
      duration: 60,
      endTime: new Date('2025-02-01T06:00:00Z'),
      id: 'completed',
      startTime: new Date('2025-02-01T05:00:00Z'),
    });

    const inProgressSleep = buildSleepActivity({
      duration: null,
      endTime: null,
      id: 'in-progress',
      startTime: new Date('2025-02-01T08:30:00Z'),
    });

    const birthDate = new Date('2025-01-14T12:00:00Z');

    const prediction = predictNextSleep(
      [inProgressSleep, completedSleep],
      birthDate,
    );

    const expectedIntervalHours =
      prediction.calculationDetails.ageBasedInterval;
    const expectedNextSleepTime = new Date('2025-02-01T06:00:00Z');
    expectedNextSleepTime.setMinutes(
      expectedNextSleepTime.getMinutes() + expectedIntervalHours * 60,
    );

    expect(prediction.lastSleepTime?.toISOString()).toBe(
      '2025-02-01T06:00:00.000Z',
    );
    expect(prediction.nextSleepTime.toISOString()).toBe(
      expectedNextSleepTime.toISOString(),
    );
    expect(prediction.recentSleepPattern[0]?.intervalFromPrevious).toBeNull();
  });
});
