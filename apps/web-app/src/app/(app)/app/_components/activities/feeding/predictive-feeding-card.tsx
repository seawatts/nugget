'use client';

import { useUser } from '@clerk/nextjs';
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
import { FeedingAssignmentSection } from './components/feeding-assignment-section';
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
  const { user } = useUser();
  const params = useParams<{ userId: string }>();
  const babyId = params?.userId;

  const { data: userData } = api.user.current.useQuery();
  const timeFormat = userData?.timeFormat || '12h';
  const userUnitPref = getVolumeUnit(userData?.measurementUnit || 'metric');

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
  const { effectiveIsOverdue, displayNextTime } = useSkipLogic({
    intervalHours: data?.prediction.intervalHours ?? 3,
    isOverdue: data?.prediction.isOverdue ?? false,
    nextTime: data?.prediction.nextFeedingTime ?? new Date(),
    overdueMinutes: data?.prediction.overdueMinutes ?? null,
    recentSkipTime: data?.prediction.recentSkipTime ?? null,
  });

  // Use feeding-specific actions hook
  const { handleSkip, handleClaim, handleUnclaim, claiming, isSkipping } =
    useFeedingActions({
      onActivityLogged,
      predictedTime: data?.prediction.nextFeedingTime,
      scheduledFeedingId: data?.scheduledFeeding?.id,
    });

  if (error) {
    return <PredictiveCardError error={error} />;
  }

  if (isLoading && !data) {
    return <PredictiveCardSkeleton activityType="feeding" />;
  }

  if (!data) return null;

  const {
    prediction,
    assignedMember,
    suggestedMember,
    familyMemberCount,
    babyAgeDays,
  } = data;
  const isAssignedToCurrentUser = assignedMember?.userId === user?.id;

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getFeedingLearningContent(babyAgeDays) : null;

  // Only show assignment section if there are multiple family members
  const showAssignment = familyMemberCount > 1;

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
          isFetching={isFetching && !isLoading}
          onInfoClick={handleInfoClick}
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

        {/* Assignment Section - Only show if multiple family members, not overdue, and not actively tracking */}
        {showAssignment && !effectiveIsOverdue && !inProgressActivity && (
          <FeedingAssignmentSection
            assignedMember={assignedMember}
            claiming={claiming}
            feedingThemeColor={feedingTheme.color}
            isAssignedToCurrentUser={isAssignedToCurrentUser}
            onClaim={handleClaim}
            onUnclaim={handleUnclaim}
            suggestedMember={suggestedMember}
          />
        )}
      </Card>

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="feeding"
        averageInterval={prediction.averageIntervalHours}
        babyAgeDays={babyAgeDays}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        recentPattern={prediction.recentFeedingPattern}
        timeFormat={timeFormat}
        title="Feeding Details"
      />
    </>
  );
}
