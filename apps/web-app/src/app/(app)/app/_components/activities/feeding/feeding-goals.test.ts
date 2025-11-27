import type { Activities } from '@nugget/db/schema';
import { beforeEach, describe, expect, it } from 'vitest';
import { getFeedingDailyProgress } from '../shared/daily-progress';
import {
  calculateTodaysFeedingStats,
  getDailyAmountGoal,
} from './feeding-goals';

let activityCounter = 0;

function makeActivity(
  overrides: Partial<typeof Activities.$inferSelect>,
): typeof Activities.$inferSelect {
  const now = overrides.startTime ?? new Date();
  const activityId = ++activityCounter;

  return {
    amountMl: null,
    assignedUserId: null,
    babyId: 'baby',
    createdAt: now,
    details: null,
    duration: null,
    endTime: null,
    familyId: 'family',
    familyMemberId: null,
    feedingSource: null,
    id: `activity-${activityId}`,
    isScheduled: false,
    notes: null,
    startTime: now,
    subjectType: 'baby',
    type: 'bottle',
    updatedAt: now,
    userId: 'user',
    ...overrides,
  } as typeof Activities.$inferSelect;
}

describe('feeding goals helpers', () => {
  beforeEach(() => {
    activityCounter = 0;
  });

  it('calculateTodaysFeedingStats includes generic feeding entries', () => {
    const stats = calculateTodaysFeedingStats([
      makeActivity({ amountMl: 60, type: 'bottle' }),
      makeActivity({ amountMl: 90, type: 'feeding' }),
      makeActivity({ amountMl: null, type: 'sleep' }),
    ]);

    expect(stats.count).toBe(2);
    expect(stats.totalMl).toBe(150);
  });

  it('getFeedingDailyProgress sums all feedings logged today', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

    const progress = getFeedingDailyProgress({
      activities: [
        makeActivity({ amountMl: 60, startTime: today, type: 'feeding' }),
        makeActivity({ amountMl: 90, startTime: today, type: 'bottle' }),
        makeActivity({ amountMl: 45, startTime: yesterday, type: 'feeding' }),
      ],
      babyAgeDays: 45,
    });

    expect(progress).not.toBeNull();
    expect(progress?.currentValue).toBe(150);
    expect(progress?.srLabel).toContain('150ml');
  });

  it('getFeedingDailyProgress returns amount goal when no feedings logged today', () => {
    const today = new Date();
    const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);
    const babyAgeDays = 35;

    const progress = getFeedingDailyProgress({
      activities: [
        makeActivity({ amountMl: 90, startTime: yesterday, type: 'bottle' }),
      ],
      babyAgeDays,
    });

    const expectedGoal = getDailyAmountGoal(babyAgeDays, 'ML');

    expect(progress).not.toBeNull();
    expect(progress?.goalValue).toBe(expectedGoal);
    expect(progress?.srLabel).toContain('0ml');
  });
});
