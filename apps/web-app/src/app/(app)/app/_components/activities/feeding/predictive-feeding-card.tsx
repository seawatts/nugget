'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import { formatDistanceToNow } from 'date-fns';
import { useParams } from 'next/navigation';
import { useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
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
  calculateFeedingStatsWithComparison,
  calculateFeedingTrendData,
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
  const params = useParams<{ babyId?: string }>();
  const babyId = params?.babyId;

  const { data: userData } = api.user.current.useQuery();
  const timeFormat = userData?.timeFormat || '12h';
  const userUnitPref = getVolumeUnit(userData?.measurementUnit || 'metric');

  // Query today's activities for goal tracking
  const { data: todaysActivitiesData } = api.activities.list.useQuery(
    {
      babyId: babyId ?? '',
      limit: 100,
    },
    { enabled: Boolean(babyId) },
  );

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
          queryData.recentActivities,
          queryData.babyBirthDate,
          queryData.feedIntervalHours,
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
    babyAgeDays !== null ? getFeedingLearningContent(babyAgeDays) : null;

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
  // Calculate stats comparison for stats drawer
  const statsComparison = calculateFeedingStatsWithComparison(
    todaysActivitiesData ?? [],
  );
  // Calculate 7-day trend data for stats drawer
  const trendData = calculateFeedingTrendData(todaysActivitiesData ?? []);

  // Calculate vitamin D tracking for last 7 days
  const vitaminDData = (() => {
    const now = new Date();
    const days: { date: string; displayDate: string; hasVitaminD: boolean }[] =
      [];

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = date.toISOString().split('T')[0] ?? '';
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

      // Check if vitamin D was logged on this day
      const hasVitaminD = (todaysActivitiesData ?? []).some((activity) => {
        const activityDate = new Date(activity.startTime);
        const activityDateKey = activityDate.toISOString().split('T')[0] ?? '';
        return (
          (activity.type as string) === 'vitamin' && activityDateKey === dateKey
        );
      });

      days.push({
        date: dateKey,
        displayDate: `${dayName} ${monthDay}`,
        hasVitaminD,
      });
    }

    return days;
  })();

  // Use predicted interval from the algorithm for more accurate daily goals
  // This adapts to actual patterns like cluster feeding
  const dailyFeedingGoal = getDailyFeedingGoal(
    babyAgeDays ?? 0,
    prediction.intervalHours,
  );
  const dailyAmountGoal = getDailyAmountGoal(
    babyAgeDays ?? 0,
    userUnitPref,
    prediction.intervalHours,
  );

  // Format countdown
  const timeUntil = formatDistanceToNow(displayNextTime, {
    addSuffix: true,
  });
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
              amountChange={statsComparison.percentageChange.totalMl}
              countChange={statsComparison.percentageChange.count}
              currentAmount={todaysStats.totalMl}
              currentCount={todaysStats.count}
              currentVitaminDCount={todaysStats.vitaminDCount}
              feedingThemeColor={feedingTheme.color}
              goalAmount={dailyAmountGoal}
              goalCount={dailyFeedingGoal}
              unit={userUnitPref}
              vitaminDChange={statsComparison.percentageChange.vitaminDCount}
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
        recentPattern={prediction.recentFeedingPattern}
        timeFormat={timeFormat}
        title="Feeding"
        unit={userUnitPref}
      />

      {/* Stats Drawer */}
      <FeedingStatsDrawer
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        statsComparison={statsComparison}
        trendData={trendData}
        unit={userUnitPref}
        vitaminDData={vitaminDData}
      />
    </>
  );
}
