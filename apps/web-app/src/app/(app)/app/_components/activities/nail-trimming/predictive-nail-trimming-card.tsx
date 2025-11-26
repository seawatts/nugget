'use client';

import { api } from '@nugget/api/react';
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
import { startOfDay, subDays } from 'date-fns';
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
import { NailTrimmingStatsDrawer } from './components';
import { getNailTrimmingLearningContent } from './learning-content';
import { NailTrimmingDialog } from './nail-trimming-dialog';

interface PredictiveNailTrimmingCardProps {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveNailTrimmingCard({
  onActivityLogged,
}: PredictiveNailTrimmingCardProps) {
  const params = useParams();
  const babyId = params.babyId as string;

  const [showDialog, setShowDialog] = useState(false);
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

  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [isLogging, setIsLogging] = useState(false);

  const nailTrimmingTheme = getActivityTheme('nail_trimming');

  // Get shared data from dashboard store
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

  // Get optimistic activities from store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Filter activities to only nail trimming
  const serverNailTrimmingActivities = useMemo(() => {
    return (
      allActivities?.filter((activity) => activity.type === 'nail_trimming') ??
      []
    );
  }, [allActivities]);

  // Merge optimistic and server activities, then deduplicate
  const nailTrimmingActivities = useMemo(() => {
    const optimisticNailTrimming = optimisticActivities.filter(
      (activity) => activity.type === 'nail_trimming',
    );

    const deduplicatedOptimistic = optimisticNailTrimming.filter(
      (optimisticActivity) => {
        const hasMatchingRealActivity = serverNailTrimmingActivities.some(
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

    return [...deduplicatedOptimistic, ...serverNailTrimmingActivities];
  }, [optimisticActivities, serverNailTrimmingActivities]);

  // Use centralized mutations hook
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
      console.error('Failed to delete nail trimming activity:', error);
    }
  };

  // Calculate 7-day tracking data using shared hook
  const nailTrimmingData = useSevenDayActivities(
    nailTrimmingActivities,
    'nail_trimming',
  );

  // Calculate weekly stats
  const goalConfig = ACTIVITY_GOALS.nail_trimming;
  const weeklyStats = useWeeklyStats(
    nailTrimmingActivities,
    'nail_trimming',
    goalConfig?.getWeeklyGoal ?? (() => 3),
    babyAgeDays,
  );

  const handleDayClick = async (day: (typeof nailTrimmingData)[0]) => {
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

        const nailTrimmingDetails = { type: 'nail_trimming' as const };

        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: normalizedDate,
          details: nailTrimmingDetails,
          duration: null,
          endTime: normalizedDate,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `optimistic-nail-trimming-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: normalizedDate,
          subjectType: 'baby' as const,
          type: 'nail_trimming' as const,
          updatedAt: normalizedDate,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        await createActivity({
          activityType: 'nail_trimming',
          babyId,
          details: nailTrimmingDetails,
          startTime: normalizedDate,
        });
      } catch (error) {
        console.error('[NailTrimming] Failed to auto-log:', error);
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
    babyAgeDays !== null ? getNailTrimmingLearningContent(babyAgeDays) : null;

  return (
    <>
      <BasePredictiveCard
        activityType="nail_trimming"
        icon={nailTrimmingTheme.icon}
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
        sevenDayData={nailTrimmingData}
        theme={nailTrimmingTheme}
        title="Nail Trimming"
        weeklyStats={goalConfig?.showProgressTracker ? weeklyStats : undefined}
      />

      <PredictiveInfoDrawer
        activityType="nail_trimming"
        babyAgeDays={babyAgeDays}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        title="Nail Trimming"
      />

      <NailTrimmingDialog
        babyId={babyId}
        initialDate={selectedDate}
        isOpen={showDialog}
        onClose={handleDialogClose}
      />

      <NailTrimmingStatsDrawer
        activities={extendedActivities}
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
            <AlertDialogTitle>Delete Nail Trimming Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this nail trimming log entry. This
              action cannot be undone.
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
