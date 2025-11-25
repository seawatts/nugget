'use client';

import type { Activities } from '@nugget/db/schema';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@nugget/ui/alert-dialog';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { ACTIVITY_GOALS } from '../shared/activity-goals-registry';
import { getActivityTheme } from '../shared/activity-theme-config';
import {
  BasePredictiveCard,
  PredictiveInfoDrawer,
} from '../shared/components/predictive-cards';
import { useSevenDayActivities } from '../shared/hooks/use-seven-day-activities';
import { useWeeklyStats } from '../shared/hooks/use-weekly-stats';
import { useActivityMutations } from '../use-activity-mutations';
import { BathDialog } from './bath-dialog';
import { BathStatsDrawer } from './components';
import { getBathLearningContent } from './learning-content';

interface PredictiveBathCardProps {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveBathCard({
  onActivityLogged,
}: PredictiveBathCardProps) {
  const params = useParams();
  const babyId = params.babyId as string;

  const [showDialog, setShowDialog] = useState(false);
  const [showInfoDrawer, setShowInfoDrawer] = useState(false);
  const [showStatsDrawer, setShowStatsDrawer] = useState(false);
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [isLogging, setIsLogging] = useState(false);

  const bathTheme = getActivityTheme('bath');

  const baby = useDashboardDataStore.use.baby();
  const userData = useDashboardDataStore.use.user();
  const allActivities = useDashboardDataStore.use.activities();

  const timeFormat = userData?.timeFormat || '12h';

  const babyAgeDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - new Date(baby.birthDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  const optimisticActivities = useOptimisticActivitiesStore.use.activities();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  const serverBathActivities = useMemo(() => {
    return allActivities?.filter((activity) => activity.type === 'bath') ?? [];
  }, [allActivities]);

  const bathActivities = useMemo(() => {
    const optimisticBath = optimisticActivities.filter(
      (activity) => activity.type === 'bath',
    );

    const deduplicatedOptimistic = optimisticBath.filter(
      (optimisticActivity) => {
        const hasMatchingRealActivity = serverBathActivities.some(
          (realActivity) => {
            const timeDiff = Math.abs(
              new Date(realActivity.startTime).getTime() -
                new Date(optimisticActivity.startTime).getTime(),
            );
            return timeDiff <= 1000;
          },
        );
        return !hasMatchingRealActivity;
      },
    );

    return [...deduplicatedOptimistic, ...serverBathActivities];
  }, [optimisticActivities, serverBathActivities]);

  const {
    deleteActivity: deleteActivityMutation,
    createActivity,
    isDeleting,
  } = useActivityMutations();

  const handleDeleteActivity = async (activityId: string) => {
    const activityToNotify = activityToDelete;
    try {
      await deleteActivityMutation(activityId);
      if (activityToNotify && onActivityLogged) {
        onActivityLogged(activityToNotify);
      }
      setActivityToDelete(null);
    } catch (error) {
      console.error('Failed to delete bath activity:', error);
    }
  };

  const bathData = useSevenDayActivities(bathActivities, 'bath');

  const goalConfig = ACTIVITY_GOALS.bath;
  const weeklyStats = useWeeklyStats(
    bathActivities,
    'bath',
    goalConfig?.getWeeklyGoal ?? (() => 3),
    babyAgeDays,
  );

  const handleDayClick = async (day: (typeof bathData)[0]) => {
    if (day.hasActivity && day.activity) {
      setActivityToDelete(day.activity);
    } else {
      const now = new Date();
      const normalizedDate = new Date(
        day.dateObj.getFullYear(),
        day.dateObj.getMonth(),
        day.dateObj.getDate(),
        now.getHours(),
        now.getMinutes(),
        now.getSeconds(),
        now.getMilliseconds(),
      );

      try {
        setIsLogging(true);

        const bathDetails = { type: 'bath' as const };

        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: normalizedDate,
          details: bathDetails,
          duration: null,
          endTime: normalizedDate,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `optimistic-bath-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: normalizedDate,
          subjectType: 'baby' as const,
          type: 'bath' as const,
          updatedAt: normalizedDate,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity({
          activityType: 'bath',
          babyId,
          details: bathDetails,
          startTime: normalizedDate,
        });
      } catch (error) {
        console.error('[Bath] Failed to auto-log:', error);
      } finally {
        setIsLogging(false);
      }
    }
  };

  const handleDialogClose = (_wasLogged: boolean) => {
    setShowDialog(false);
    setSelectedDate(null);
  };

  const handleConfirmDelete = () => {
    if (activityToDelete) {
      void handleDeleteActivity(activityToDelete.id);
    }
  };

  const learningContent =
    babyAgeDays !== null ? getBathLearningContent(babyAgeDays) : null;

  return (
    <>
      <BasePredictiveCard
        activityType="bath"
        icon={bathTheme.icon}
        isLogging={isLogging}
        onAddClick={() => {
          setShowDialog(true);
        }}
        onDayClick={(day) => {
          void handleDayClick(day);
        }}
        onInfoClick={() => {
          setShowInfoDrawer(true);
        }}
        onStatsClick={() => {
          setShowStatsDrawer(true);
        }}
        sevenDayData={bathData}
        theme={bathTheme}
        title="Bath"
        weeklyStats={goalConfig?.showProgressTracker ? weeklyStats : undefined}
      />

      <PredictiveInfoDrawer
        activityType="bath"
        babyAgeDays={babyAgeDays}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        title="Bath"
      />

      <BathDialog
        babyId={babyId}
        initialDate={selectedDate}
        isOpen={showDialog}
        onClose={handleDialogClose}
      />

      <BathStatsDrawer
        activities={bathActivities}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        timeFormat={timeFormat}
      />

      <AlertDialog
        onOpenChange={(open) => !open && setActivityToDelete(null)}
        open={!!activityToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Bath Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this bath log entry. This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              disabled={isDeleting}
              onClick={handleConfirmDelete}
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
