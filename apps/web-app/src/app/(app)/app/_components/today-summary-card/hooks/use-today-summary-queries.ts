'use client';

import { api } from '@nugget/api/react';
import { useMemo } from 'react';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { predictNextFeeding } from '../../activities/feeding/prediction';

interface UseTodaySummaryQueriesOptions {
  babyId: string;
}

export function useTodaySummaryQueries({
  babyId,
}: UseTodaySummaryQueriesOptions) {
  // Get optimistic activities from Zustand store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Today summary query
  const {
    isLoading: todaySummaryIsLoading,
    isFetching: todaySummaryIsFetching,
  } = api.activities.getTodaySummary.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  // Celebration data
  const { data: celebrationData } =
    api.celebrations.getCarouselContent.useQuery(
      { babyId: babyId ?? '' },
      { enabled: Boolean(babyId), staleTime: 86400000 },
    );

  // Feeding prediction data
  const {
    data: feedingQueryData,
    isLoading: feedingIsLoading,
    isFetching: feedingIsFetching,
  } = api.activities.getUpcomingFeeding.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  // Diaper prediction data
  const {
    data: diaperQueryData,
    isLoading: diaperIsLoading,
    isFetching: diaperIsFetching,
  } = api.activities.getUpcomingDiaper.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  // Sleep prediction data
  const {
    data: sleepQueryData,
    isLoading: sleepIsLoading,
    isFetching: sleepIsFetching,
  } = api.activities.getUpcomingSleep.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  // In-progress activity query
  const { data: inProgressActivity } =
    api.activities.getInProgressActivity.useQuery(
      {
        activityType: 'sleep',
        babyId: babyId ?? '',
      },
      { enabled: Boolean(babyId), refetchInterval: 5000 },
    );

  // Process feeding prediction data
  const feedingData = useMemo(() => {
    if (!feedingQueryData) return null;
    return {
      babyAgeDays: feedingQueryData.babyAgeDays,
      babyBirthDate: feedingQueryData.babyBirthDate,
      prediction: predictNextFeeding(
        [...optimisticActivities, ...feedingQueryData.recentActivities],
        feedingQueryData.babyBirthDate,
        feedingQueryData.feedIntervalHours,
        feedingQueryData.customPreferences,
      ),
      recentActivities: feedingQueryData.recentActivities,
    };
  }, [feedingQueryData, optimisticActivities]);

  const isFetching =
    (todaySummaryIsFetching && !todaySummaryIsLoading) ||
    (feedingIsFetching && !feedingIsLoading) ||
    (diaperIsFetching && !diaperIsLoading) ||
    (sleepIsFetching && !sleepIsLoading);

  return {
    // Query data
    celebrationData,
    diaperIsLoading,
    diaperQueryData,
    feedingData,
    feedingIsLoading,
    feedingQueryData,
    inProgressActivity: inProgressActivity ?? null,
    isFetching,

    // Optimistic activities
    optimisticActivities,
    sleepIsLoading,
    sleepQueryData,

    // Loading states
    todaySummaryIsLoading,
  };
}

export type TodaySummaryQueriesResult = ReturnType<
  typeof useTodaySummaryQueries
>;
