'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow, startOfDay, subDays } from 'date-fns';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getActivityTheme } from '../shared/activity-theme-config';
import {
  PredictiveCardError,
  PredictiveCardHeader,
  PredictiveCardSkeleton,
  PredictiveInfoDrawer,
  PredictiveOverdueActions,
  PredictiveTimeDisplay,
  usePredictiveTimer,
  useSkipLogic,
} from '../shared/components/predictive-cards';
import { formatVolumeDisplay, getVolumeUnit } from '../shared/volume-utils';
import { getAssignedMember, suggestFamilyMember } from './assignment';
import { FeedingStatsDrawer } from './components';
import { FeedingGoalDisplay } from './components/feeding-goal-display';
import {
  calculateTodaysFeedingStats,
  getDailyAmountGoal,
  getDailyFeedingGoal,
} from './feeding-goals';
import { getFeedingGuidanceByAge } from './feeding-intervals';
import { useFeedingActions } from './hooks/use-feeding-actions';
import { getFeedingLearningContent } from './learning-content';
import { predictNextFeeding } from './prediction';

interface PredictiveFeedingCardProps {
  onCardClick?: () => void;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveFeedingCard({
  onCardClick,
  onActivityLogged,
}: PredictiveFeedingCardProps) {
  const params = useParams<{ babyId: string }>();
  const babyId = params.babyId;

  // Get shared data from dashboard store (populated by DashboardContainer)
  const userData = useDashboardDataStore.use.user();
  const allActivities = useDashboardDataStore.use.activities();
  const baby = useDashboardDataStore.use.baby();

  const timeFormat = userData?.timeFormat || '12h';
  const userUnitPref = getVolumeUnit(userData?.measurementUnit || 'metric');

  // Get optimistic activities from store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Filter to today's activities for goal display
  const todaysActivitiesData = allActivities?.filter((activity) => {
    const activityDate = new Date(activity.startTime);
    return activityDate >= startOfDay(new Date());
  });

  // Use tRPC query for prediction data
  const {
    data: queryData,
    isLoading,
    isFetching,
    error: queryError,
  } = api.activities.getUpcomingFeeding.useQuery(
    { babyId: babyId ?? '' },
    { enabled: Boolean(babyId) },
  );

  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);

  // Fetch extended activities for stats drawer (90 days, only when drawer opens)
  const ninetyDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 90)), []);
  const { data: extendedActivities = [] } = api.activities.list.useQuery(
    {
      babyId,
      limit: 500,
      since: ninetyDaysAgo,
    },
    {
      enabled: Boolean(babyId) && showStatsDrawer,
      staleTime: 60000,
    },
  );

  // Process prediction data from tRPC query
  const data = queryData
    ? {
        assignedMember: queryData.scheduledFeeding?.assignedUserId
          ? getAssignedMember(
              queryData.scheduledFeeding,
              queryData.familyMembers,
            )
          : null,
        babyAgeDays: queryData.babyAgeDays,
        familyMemberCount: queryData.familyMemberCount,
        guidanceMessage:
          queryData.babyAgeDays !== null
            ? getFeedingGuidanceByAge(queryData.babyAgeDays)
            : "Follow your pediatrician's feeding recommendations.",
        inProgressActivity: queryData.inProgressActivity,
        prediction: predictNextFeeding(
          // Merge optimistic activities with recent activities for accurate predictions
          [...optimisticActivities, ...queryData.recentActivities],
          queryData.babyBirthDate,
          queryData.feedIntervalHours,
          queryData.customPreferences,
        ),
        scheduledFeeding: queryData.scheduledFeeding,
        suggestedMember: queryData.scheduledFeeding?.assignedUserId
          ? null
          : suggestFamilyMember(
              queryData.familyMembers,
              queryData.recentActivities,
            ).suggestedMember,
      }
    : null;

  const inProgressActivity = data?.inProgressActivity || null;
  const error = queryError?.message || null;

  // Use shared timer hook for in-progress activities
  const { elapsedTime } = usePredictiveTimer(inProgressActivity);

  // Use shared skip logic hook (must be called before early returns)
  const { effectiveIsOverdue: skipLogicOverdue, displayNextTime } =
    useSkipLogic({
      intervalHours: data?.prediction.intervalHours ?? 3,
      isOverdue: data?.prediction.isOverdue ?? false,
      nextTime: data?.prediction.nextFeedingTime ?? new Date(),
      overdueMinutes: data?.prediction.overdueMinutes ?? null,
      recentSkipTime: data?.prediction.recentSkipTime ?? null,
    });

  // Override effectiveIsOverdue based on showPredictiveTimes preference
  const effectiveIsOverdue =
    skipLogicOverdue && (userData?.showPredictiveTimes ?? true);

  // Use feeding-specific actions hook
  const { handleSkip, handleQuickLog, isSkipping, isCreating } =
    useFeedingActions({
      babyId,
      onActivityLogged,
      predictedTime: data?.prediction.nextFeedingTime,
      quickLogEnabled: userData?.quickLogEnabled ?? true,
      scheduledFeedingId: data?.scheduledFeeding?.id,
      suggestedAmount: data?.prediction.suggestedAmount,
      suggestedDuration: data?.prediction.suggestedDuration,
      suggestedType: data?.prediction.suggestedType,
      useLastAmount: userData?.quickLogFeedingUseLastAmount ?? true,
      useLastType: userData?.quickLogFeedingUseLastType ?? true,
      useTypicalDuration: userData?.quickLogFeedingUseTypicalDuration ?? true,
    });

  if (error) {
    return <PredictiveCardError error={error} />;
  }

  if (isLoading && !data) {
    return <PredictiveCardSkeleton activityType="feeding" />;
  }

  if (!data) return null;

  const { prediction, babyAgeDays } = data;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null
      ? getFeedingLearningContent(babyAgeDays, baby?.firstName || undefined)
      : null;

  // Build quick log settings for info drawer
  const quickLogSettings = {
    activeSettings: [
      ...((userData?.quickLogFeedingUseLastAmount ?? true)
        ? ['Last amount']
        : []),
      ...((userData?.quickLogFeedingUseTypicalDuration ?? true)
        ? ['Typical duration']
        : []),
      ...((userData?.quickLogFeedingUseLastType ?? true) ? ['Last type'] : []),
    ],
    enabled: userData?.quickLogEnabled ?? true,
  };

  // Calculate today's feeding statistics for goal display
  const todaysStats = calculateTodaysFeedingStats(todaysActivitiesData ?? []);
  // Calculate 7-day trend data for stats drawer (needs last 7 days of data)

  // Use predicted interval from the algorithm for more accurate daily goals
  // This adapts to actual patterns like cluster feeding
  const dailyFeedingGoal = getDailyFeedingGoal(
    babyAgeDays ?? 0,
    prediction.intervalHours,
    prediction.calculationDetails.dataPoints,
  );
  const dailyAmountGoal = getDailyAmountGoal(
    babyAgeDays ?? 0,
    userUnitPref,
    prediction.intervalHours,
    prediction.calculationDetails.dataPoints,
  );

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  }).replace(/^in about /, 'in ');
  const exactTime = formatTimeWithPreference(displayNextTime, timeFormat);

  // Format amount for display based on user preference
  const formatAmount = (ml: number | null) => {
    if (!ml) return null;
    return formatVolumeDisplay(ml, userUnitPref, true);
  };

  const handleCardClick = () => {
    if (onCardClick) {
      onCardClick();
    }
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDrawer(true);
  };

  const handleStatsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatsDrawer(true);
  };

  // Get theme for feeding activity
  const feedingTheme = getActivityTheme('feeding');
  const FeedingIcon = feedingTheme.icon;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer col-span-2',
          `bg-${feedingTheme.color} ${feedingTheme.textColor}`,
          effectiveIsOverdue
            ? 'border-4 border-dashed border-amber-500'
            : 'border-0',
        )}
        onClick={handleCardClick}
      >
        <PredictiveCardHeader
          icon={FeedingIcon}
          isCreatingQuickLog={isCreating}
          isFetching={isFetching && !isLoading}
          onInfoClick={handleInfoClick}
          onQuickLog={handleQuickLog}
          onStatsClick={handleStatsClick}
          quickLogEnabled={userData?.quickLogEnabled ?? true}
          showStatsIcon={userData?.showActivityGoals ?? true}
          title="Feeding"
        >
          <PredictiveTimeDisplay
            activityLabel="feeding"
            effectiveIsOverdue={effectiveIsOverdue}
            elapsedTime={elapsedTime}
            exactTime={exactTime}
            inProgressActivity={inProgressActivity}
            isLoading={isLoading}
            lastActivityAmount={formatAmount(prediction.lastFeedingAmount)}
            lastActivityTime={prediction.lastFeedingTime}
            overdueMinutes={prediction.overdueMinutes}
            predictedAmount={formatAmount(prediction.suggestedAmount)}
            showPredictiveTimes={userData?.showPredictiveTimes ?? true}
            timeFormat={timeFormat}
            timeUntil={timeUntil}
          />
        </PredictiveCardHeader>

        {/* Overdue Actions - Only show if not actively tracking */}
        {!inProgressActivity && effectiveIsOverdue && (
          <PredictiveOverdueActions
            isSkipping={isSkipping}
            onLog={handleCardClick}
            onSkip={handleSkip}
          />
        )}

        {/* Assignment Section - Hidden for now, keeping code intact for future use */}
        {/* {showAssignment && !effectiveIsOverdue && !inProgressActivity && (
          <FeedingAssignmentSection
            assignedMember={assignedMember}
            claiming={claiming}
            feedingThemeColor={feedingTheme.color}
            isAssignedToCurrentUser={isAssignedToCurrentUser}
            onClaim={handleClaim}
            onUnclaim={handleUnclaim}
            suggestedMember={suggestedMember}
          />
        )} */}

        {/* Goal Tracking Display - Shows feeding progress for today */}
        {!effectiveIsOverdue &&
          !inProgressActivity &&
          (userData?.showActivityGoals ?? true) && (
            <FeedingGoalDisplay
              currentAmount={todaysStats.totalMl}
              currentCount={todaysStats.count}
              feedingThemeColor={feedingTheme.color}
              goalAmount={dailyAmountGoal}
              goalCount={dailyFeedingGoal}
              unit={userUnitPref}
            />
          )}
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="feeding"
        averageInterval={prediction.averageIntervalHours}
        babyAgeDays={babyAgeDays}
        calculationDetails={prediction.calculationDetails}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        quickLogSettings={quickLogSettings}
        timeFormat={timeFormat}
        title="Feeding"
        unit={userUnitPref}
      />

      {/* Stats Drawer */}
      <FeedingStatsDrawer
        activities={extendedActivities}
        dailyAmountGoal={dailyAmountGoal}
        dailyCountGoal={dailyFeedingGoal}
        goalContext={{
          babyAgeDays,
          babyBirthDate: queryData?.babyBirthDate ?? null,
          dataPointsCount: prediction.calculationDetails.dataPoints,
          predictedIntervalHours: prediction.intervalHours,
        }}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        recentActivities={prediction.recentFeedingPattern.map((item) => ({
          ...item,
          amountMl: item.amountMl ?? undefined,
        }))}
        timeFormat={timeFormat}
        unit={userUnitPref}
      />
    </>
  );
}
