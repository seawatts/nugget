'use client';

import { useParams } from 'next/navigation';
import { useEffect, useMemo, useState } from 'react';
import { useDashboardLoadTracker } from '~/app/(app)/app/babies/[babyId]/dashboard/_components/dashboard-load-tracker';
import { getActivityTheme } from '../activities/shared/activity-theme-config';
import type { ActivityWithUser } from '../activities/shared/components/activity-timeline';
import {
  ActivityQuickButton,
  SleepButtons,
  TodaySummaryDrawers,
  TodaySummaryHeader,
  UpcomingCelebrationBanner,
} from './components';
import {
  useLastActivityInfo,
  useQuickActions,
  useTodaySummaryQueries,
} from './hooks';
import type {
  TodaySummaryCardProps,
  UpcomingCelebration,
} from './today-summary-card.types';

export function TodaySummaryCard({
  babyBirthDate,
  babyName,
  babyPhotoUrl,
  babyAvatarBackgroundColor,
  measurementUnit = 'metric',
}: TodaySummaryCardProps) {
  // Get babyId from params
  const params = useParams();
  const babyId = params.babyId as string;
  const tracker = useDashboardLoadTracker();

  // Track when component finishes loading
  useEffect(() => {
    if (tracker) {
      tracker.markComponentLoaded('todaySummary');
    }
  }, [tracker]);

  // Fetch all query data
  const queries = useTodaySummaryQueries({ babyId });
  const {
    celebrationData,
    isFetching,
    feedingIsLoading,
    diaperIsLoading,
    sleepIsLoading,
  } = queries;

  // Get last activity info
  const lastActivityInfo = useLastActivityInfo({ queries });
  const {
    lastBottleInfo,
    lastNursingInfo,
    lastWetDiaperInfo,
    lastDirtyDiaperInfo,
    lastSleepInfo,
  } = lastActivityInfo;

  // Get quick actions and state
  const quickActions = useQuickActions({ babyId, queries });
  const {
    openDrawer,
    creatingType,
    showSleepConfirmation,
    setShowSleepConfirmation,
    showStatsDrawer,
    setShowStatsDrawer,
    showAchievementsDrawer,
    setShowAchievementsDrawer,
    inProgressActivity,
    sleepDuration,
    sleepDurationMinutes,
    handleBottleClick,
    handleQuickNursing,
    handleDiaperClick,
    handleSleepTimerClick,
    handleManualSleepClick,
    handleStopSleepAndCreate,
    handleKeepSleepingAndCreate,
    handleDrawerClose,
    handleStatsClick,
    handleAchievementsClick,
  } = quickActions;

  // State for edit drawer
  const [editingActivity, setEditingActivity] =
    useState<ActivityWithUser | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  // Get activity themes
  const feedingTheme = getActivityTheme('feeding');
  const diaperTheme = getActivityTheme('diaper');
  const sleepTheme = getActivityTheme('sleep');
  const SleepIcon = sleepTheme.icon;

  // Compute upcoming celebration
  const upcomingCelebration = useMemo((): UpcomingCelebration | null => {
    if (!celebrationData || celebrationData.celebration) return null;
    const next = celebrationData.nextCelebration;
    if (!next?.shouldShow) return null;
    const daysUntil = Math.max(0, next.day - (celebrationData.ageInDays ?? 0));
    const cleanedTitle = next.title
      ?.replace(/[🎉🎂]/gu, '')
      .replace(/happy\s+/gi, '')
      .trim();
    return {
      babyLabel: celebrationData.babyName ?? babyName ?? 'Baby',
      daysUntil,
      title: cleanedTitle || 'special day',
    };
  }, [babyName, celebrationData]);

  const handleEditDrawerClose = () => {
    setEditDrawerOpen(false);
    setEditingActivity(null);
  };

  return (
    <div className="rounded-2xl border border-border/40 bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding backdrop-blur-xl p-6 shadow-xl shadow-activity-nail-trimming/20">
      {/* Header */}
      <div className="mb-4">
        <TodaySummaryHeader
          babyAvatarBackgroundColor={babyAvatarBackgroundColor}
          babyBirthDate={babyBirthDate}
          babyName={babyName}
          babyPhotoUrl={babyPhotoUrl}
          isFetching={isFetching}
          onAchievementsClick={handleAchievementsClick}
          onStatsClick={handleStatsClick}
        />
        {upcomingCelebration && (
          <UpcomingCelebrationBanner celebration={upcomingCelebration} />
        )}
      </div>

      {/* Activity Buttons Grid */}
      <div className="pt-0">
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          {/* Bottle Button */}
          <ActivityQuickButton
            disabled={creatingType !== null}
            isCreating={creatingType === 'bottle'}
            isLoading={feedingIsLoading}
            lastActivityInfo={lastBottleInfo}
            onClick={handleBottleClick}
            themeTextColor={feedingTheme.textColor}
            type="bottle"
          />

          {/* Nursing Button */}
          <ActivityQuickButton
            disabled={creatingType !== null}
            isCreating={creatingType === 'nursing'}
            isLoading={feedingIsLoading}
            lastActivityInfo={lastNursingInfo}
            onClick={handleQuickNursing}
            themeTextColor={feedingTheme.textColor}
            type="nursing"
          />

          {/* Pee Button */}
          <ActivityQuickButton
            disabled={creatingType !== null}
            isCreating={creatingType === 'wet'}
            isLoading={diaperIsLoading}
            lastActivityInfo={lastWetDiaperInfo}
            onClick={() => handleDiaperClick('wet')}
            themeTextColor={diaperTheme.textColor}
            type="wet"
          />

          {/* Poop Button */}
          <ActivityQuickButton
            disabled={creatingType !== null}
            isCreating={creatingType === 'dirty'}
            isLoading={diaperIsLoading}
            lastActivityInfo={lastDirtyDiaperInfo}
            onClick={() => handleDiaperClick('dirty')}
            themeTextColor={diaperTheme.textColor}
            type="dirty"
          />

          {/* Sleep Buttons */}
          <SleepButtons
            disabled={creatingType !== null}
            isCreating={creatingType === 'sleep-timer'}
            isTimerActive={!!inProgressActivity}
            lastSleepInfo={lastSleepInfo}
            onManualClick={handleManualSleepClick}
            onTimerClick={handleSleepTimerClick}
            SleepIcon={SleepIcon}
            sleepDurationMinutes={sleepDurationMinutes}
            sleepIsLoading={sleepIsLoading}
            sleepThemeTextColor={sleepTheme.textColor}
          />
        </div>
      </div>

      {/* Drawers */}
      <TodaySummaryDrawers
        babyId={babyId}
        editDrawerOpen={editDrawerOpen}
        editingActivity={editingActivity}
        measurementUnit={measurementUnit}
        onAchievementsDrawerChange={setShowAchievementsDrawer}
        onDrawerClose={handleDrawerClose}
        onEditDrawerClose={handleEditDrawerClose}
        onKeepSleeping={handleKeepSleepingAndCreate}
        onSleepConfirmationChange={setShowSleepConfirmation}
        onStatsDrawerChange={setShowStatsDrawer}
        onStopSleep={handleStopSleepAndCreate}
        openDrawer={openDrawer}
        showAchievementsDrawer={showAchievementsDrawer}
        showSleepConfirmation={showSleepConfirmation}
        showStatsDrawer={showStatsDrawer}
        sleepDuration={sleepDuration}
      />
    </div>
  );
}
