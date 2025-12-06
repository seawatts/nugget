'use client';

import { useMemo } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { formatCompactRelativeTimeWithAgo } from '../../activities/shared/utils/format-compact-relative-time';
import type { LastActivityInfo } from '../today-summary-card.types';
import { formatLastActivityUser } from '../today-summary-card.utils';
import type { TodaySummaryQueriesResult } from './use-today-summary-queries';

interface UseLastActivityInfoOptions {
  queries: TodaySummaryQueriesResult;
}

export function useLastActivityInfo({ queries }: UseLastActivityInfoOptions) {
  const { feedingQueryData, diaperQueryData, sleepQueryData } = queries;

  // Get user preferences from dashboard store
  const user = useDashboardDataStore.use.user();
  const timeFormat = user?.timeFormat || '12h';

  // Find last bottle activity
  const lastBottleActivity = useMemo(() => {
    if (!feedingQueryData?.recentActivities) return null;
    return (
      feedingQueryData.recentActivities.find(
        (a) =>
          a.type === 'bottle' &&
          !a.isScheduled &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true),
      ) || null
    );
  }, [feedingQueryData?.recentActivities]);

  // Find last nursing activity
  const lastNursingActivity = useMemo(() => {
    if (!feedingQueryData?.recentActivities) return null;
    return (
      feedingQueryData.recentActivities.find(
        (a) =>
          a.type === 'nursing' &&
          !a.isScheduled &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true),
      ) || null
    );
  }, [feedingQueryData?.recentActivities]);

  // Find last wet diaper activity (includes 'both' type)
  const lastWetDiaperActivity = useMemo(() => {
    if (!diaperQueryData?.recentActivities) return null;
    return (
      diaperQueryData.recentActivities.find(
        (a) =>
          (a.type === 'diaper' ||
            a.type === 'wet' ||
            a.type === 'dirty' ||
            a.type === 'both') &&
          !a.isScheduled &&
          !(
            a.details &&
            'skipped' in a.details &&
            a.details.skipped === true
          ) &&
          (a.details?.type === 'wet' || a.details?.type === 'both'),
      ) || null
    );
  }, [diaperQueryData?.recentActivities]);

  // Find last dirty diaper activity (includes 'both' type)
  const lastDirtyDiaperActivity = useMemo(() => {
    if (!diaperQueryData?.recentActivities) return null;
    return (
      diaperQueryData.recentActivities.find(
        (a) =>
          (a.type === 'diaper' ||
            a.type === 'wet' ||
            a.type === 'dirty' ||
            a.type === 'both') &&
          !a.isScheduled &&
          !(
            a.details &&
            'skipped' in a.details &&
            a.details.skipped === true
          ) &&
          (a.details?.type === 'dirty' || a.details?.type === 'both'),
      ) || null
    );
  }, [diaperQueryData?.recentActivities]);

  // Find last sleep activity
  const lastSleepActivity = useMemo(() => {
    if (!sleepQueryData?.recentActivities) return null;
    return (
      sleepQueryData.recentActivities.find(
        (a) =>
          a.type === 'sleep' &&
          !a.isScheduled &&
          a.endTime !== null &&
          a.duration &&
          a.duration > 0 &&
          !(a.details && 'skipped' in a.details && a.details.skipped === true),
      ) || null
    );
  }, [sleepQueryData?.recentActivities]);

  // Format activity info
  const lastBottleInfo: LastActivityInfo = useMemo(
    () => ({
      activity: lastBottleActivity,
      exactTime: lastBottleActivity
        ? formatTimeWithPreference(
            new Date(lastBottleActivity.startTime),
            timeFormat,
          )
        : null,
      time: lastBottleActivity
        ? formatCompactRelativeTimeWithAgo(
            new Date(lastBottleActivity.startTime),
          )
        : null,
      user: formatLastActivityUser(lastBottleActivity?.user),
    }),
    [lastBottleActivity, timeFormat],
  );

  const lastNursingInfo: LastActivityInfo = useMemo(
    () => ({
      activity: lastNursingActivity,
      exactTime: lastNursingActivity
        ? formatTimeWithPreference(
            new Date(lastNursingActivity.startTime),
            timeFormat,
          )
        : null,
      time: lastNursingActivity
        ? formatCompactRelativeTimeWithAgo(
            new Date(lastNursingActivity.startTime),
          )
        : null,
      user: formatLastActivityUser(lastNursingActivity?.user),
    }),
    [lastNursingActivity, timeFormat],
  );

  const lastWetDiaperInfo: LastActivityInfo = useMemo(
    () => ({
      activity: lastWetDiaperActivity,
      exactTime: lastWetDiaperActivity
        ? formatTimeWithPreference(
            new Date(lastWetDiaperActivity.startTime),
            timeFormat,
          )
        : null,
      time: lastWetDiaperActivity
        ? formatCompactRelativeTimeWithAgo(
            new Date(lastWetDiaperActivity.startTime),
          )
        : null,
      user: formatLastActivityUser(lastWetDiaperActivity?.user),
    }),
    [lastWetDiaperActivity, timeFormat],
  );

  const lastDirtyDiaperInfo: LastActivityInfo = useMemo(
    () => ({
      activity: lastDirtyDiaperActivity,
      exactTime: lastDirtyDiaperActivity
        ? formatTimeWithPreference(
            new Date(lastDirtyDiaperActivity.startTime),
            timeFormat,
          )
        : null,
      time: lastDirtyDiaperActivity
        ? formatCompactRelativeTimeWithAgo(
            new Date(lastDirtyDiaperActivity.startTime),
          )
        : null,
      user: formatLastActivityUser(lastDirtyDiaperActivity?.user),
    }),
    [lastDirtyDiaperActivity, timeFormat],
  );

  const lastSleepInfo: LastActivityInfo = useMemo(
    () => ({
      activity: lastSleepActivity,
      exactTime: lastSleepActivity
        ? formatTimeWithPreference(
            new Date(lastSleepActivity.startTime),
            timeFormat,
          )
        : null,
      time: lastSleepActivity
        ? formatCompactRelativeTimeWithAgo(
            new Date(lastSleepActivity.startTime),
          )
        : null,
      user: formatLastActivityUser(lastSleepActivity?.user),
    }),
    [lastSleepActivity, timeFormat],
  );

  return {
    lastBottleInfo,
    lastDirtyDiaperInfo,
    lastNursingInfo,
    lastSleepInfo,
    lastWetDiaperInfo,
  };
}

export type LastActivityInfoResult = ReturnType<typeof useLastActivityInfo>;
