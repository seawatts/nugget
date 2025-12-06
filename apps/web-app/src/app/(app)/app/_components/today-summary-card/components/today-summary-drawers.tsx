'use client';

import { AchievementsDrawer } from '../../achievements-drawer';
import { TimelineDiaperDrawer } from '../../activities/diaper/timeline-diaper-drawer';
import { FeedingActivityDrawer } from '../../activities/feeding/feeding-activity-drawer';
import { TimelineFeedingDrawer } from '../../activities/feeding/timeline-feeding-drawer';
import type { ActivityWithUser } from '../../activities/shared/components/activity-timeline';
import { StopSleepConfirmationDialog } from '../../activities/shared/components/stop-sleep-confirmation-dialog';
import { TimelineDrawerWrapper } from '../../activities/shared/components/timeline-drawer-wrapper';
import { SleepActivityDrawer } from '../../activities/sleep/sleep-activity-drawer';
import { TimelineSleepDrawer } from '../../activities/sleep/timeline-sleep-drawer';
import { BabyStatsDrawer } from '../../baby-stats-drawer';

interface TodaySummaryDrawersProps {
  babyId: string;
  measurementUnit: 'metric' | 'imperial';

  // Drawer state
  openDrawer: string | null;
  onDrawerClose: () => void;

  // Edit drawer state
  editingActivity: ActivityWithUser | null;
  editDrawerOpen: boolean;
  onEditDrawerClose: () => void;

  // Sleep confirmation
  showSleepConfirmation: boolean;
  onSleepConfirmationChange: (open: boolean) => void;
  onStopSleep: () => void;
  onKeepSleeping: () => void;
  sleepDuration: string | null;

  // Stats drawer
  showStatsDrawer: boolean;
  onStatsDrawerChange: (open: boolean) => void;

  // Achievements drawer
  showAchievementsDrawer: boolean;
  onAchievementsDrawerChange: (open: boolean) => void;
}

export function TodaySummaryDrawers({
  babyId,
  measurementUnit,
  openDrawer,
  onDrawerClose,
  editingActivity,
  editDrawerOpen,
  onEditDrawerClose,
  showSleepConfirmation,
  onSleepConfirmationChange,
  onStopSleep,
  onKeepSleeping,
  sleepDuration,
  showStatsDrawer,
  onStatsDrawerChange,
  showAchievementsDrawer,
  onAchievementsDrawerChange,
}: TodaySummaryDrawersProps) {
  return (
    <>
      {/* Activity Edit Drawers */}
      {editingActivity &&
        (editingActivity.type === 'feeding' ||
          editingActivity.type === 'nursing' ||
          editingActivity.type === 'bottle' ||
          editingActivity.type === 'solids') &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={onEditDrawerClose}
            title="Edit Feeding"
          >
            <TimelineFeedingDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={editDrawerOpen}
              onClose={onEditDrawerClose}
            />
          </TimelineDrawerWrapper>
        )}

      {editingActivity &&
        editingActivity.type === 'sleep' &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={onEditDrawerClose}
            title="Edit Sleep"
          >
            <TimelineSleepDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={editDrawerOpen}
              onClose={onEditDrawerClose}
            />
          </TimelineDrawerWrapper>
        )}

      {editingActivity &&
        (editingActivity.type === 'diaper' ||
          editingActivity.type === 'wet' ||
          editingActivity.type === 'dirty' ||
          editingActivity.type === 'both') &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={onEditDrawerClose}
            title="Edit Diaper"
          >
            <TimelineDiaperDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={editDrawerOpen}
              onClose={onEditDrawerClose}
            />
          </TimelineDrawerWrapper>
        )}

      {/* Feeding Drawer */}
      {(openDrawer === 'feeding' ||
        openDrawer === 'bottle' ||
        openDrawer === 'nursing') && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={onDrawerClose}
          title="Log Feeding"
        >
          <FeedingActivityDrawer
            babyId={babyId}
            existingActivity={null}
            initialType={
              openDrawer === 'bottle'
                ? 'bottle'
                : openDrawer === 'nursing'
                  ? 'nursing'
                  : null
            }
            isOpen={true}
            onClose={onDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Sleep Drawer */}
      {openDrawer === 'sleep' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={onDrawerClose}
          title="Log Sleep"
        >
          <SleepActivityDrawer
            babyId={babyId}
            existingActivity={null}
            isOpen={true}
            onClose={onDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Sleep Stop Confirmation Dialog */}
      <StopSleepConfirmationDialog
        onKeepSleeping={onKeepSleeping}
        onOpenChange={onSleepConfirmationChange}
        onStopSleep={onStopSleep}
        open={showSleepConfirmation}
        sleepDuration={sleepDuration}
      />

      {/* Baby Stats Drawer */}
      <BabyStatsDrawer
        babyId={babyId}
        measurementUnit={measurementUnit}
        onOpenChange={onStatsDrawerChange}
        open={showStatsDrawer}
      />

      {/* Achievements Drawer */}
      <AchievementsDrawer
        babyId={babyId}
        onOpenChange={onAchievementsDrawerChange}
        open={showAchievementsDrawer}
      />
    </>
  );
}
