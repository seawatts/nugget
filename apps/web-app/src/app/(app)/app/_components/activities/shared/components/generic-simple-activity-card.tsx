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
import { useActivityMutations } from '../../use-activity-mutations';
import type { SimpleActivityConfig } from '../activity-config-registry';
import { useSevenDayActivities } from '../hooks/use-seven-day-activities';
import { useWeeklyStats } from '../hooks/use-weekly-stats';
import { GenericSimpleActivityDialog } from './generic-simple-activity-dialog';
import { GenericSimpleActivityStatsDrawer } from './generic-simple-activity-stats-drawer';
import { BasePredictiveCard, PredictiveInfoDrawer } from './predictive-cards';

interface GenericSimpleActivityCardProps {
  config: SimpleActivityConfig;
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function GenericSimpleActivityCard({
  config,
  onActivityLogged,
}: GenericSimpleActivityCardProps) {
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

  const theme = config.theme;

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

  // Filter activities to only this activity type
  const serverActivities = useMemo(() => {
    return (
      allActivities?.filter((activity) => activity.type === config.type) ?? []
    );
  }, [allActivities, config.type]);

  // Merge optimistic and server activities, then deduplicate
  const activities = useMemo(() => {
    const optimisticFiltered = optimisticActivities.filter(
      (activity) => activity.type === config.type,
    );

    const deduplicatedOptimistic = optimisticFiltered.filter(
      (optimisticActivity) => {
        const hasMatchingRealActivity = serverActivities.some(
          (realActivity) => {
            const timeDiff = Math.abs(
              new Date(realActivity.startTime).getTime() -
                new Date(optimisticActivity.startTime).getTime(),
            );
            return timeDiff <= 1000; // 1 second tolerance
          },
        );
        return !hasMatchingRealActivity;
      },
    );

    return [...deduplicatedOptimistic, ...serverActivities];
  }, [optimisticActivities, serverActivities, config.type]);

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
      console.error(`Failed to delete ${config.type} activity:`, error);
    }
  };

  // Calculate 7-day tracking data using shared hook
  const sevenDayData = useSevenDayActivities(activities, config.type);

  // Calculate weekly stats
  const goalConfig = config.goals;
  const weeklyStats = useWeeklyStats(
    activities,
    config.type,
    goalConfig?.getWeeklyGoal ?? (() => 7),
    babyAgeDays,
  );

  const handleDayClick = async (day: (typeof sevenDayData)[0]) => {
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

        // Create details with just the type
        const details = { type: config.type };

        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: normalizedDate,
          details,
          duration: null,
          endTime: normalizedDate,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `optimistic-${config.type}-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: normalizedDate,
          subjectType: 'baby' as const,
          type: config.type as typeof Activities.$inferSelect.type,
          updatedAt: normalizedDate,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        addOptimisticActivity(optimisticActivity);

        // Create actual activity in the background
        await createActivity({
          activityType: config.type as typeof Activities.$inferSelect.type,
          babyId,
          details,
          startTime: normalizedDate,
        });
      } catch (error) {
        console.error(`[${config.type}] Failed to auto-log:`, error);
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

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null && config.getLearningContent
      ? config.getLearningContent(babyAgeDays)
      : null;

  return (
    <>
      <BasePredictiveCard
        activityType={config.type}
        icon={theme.icon}
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
        sevenDayData={sevenDayData}
        theme={theme}
        title={config.title}
        weeklyStats={goalConfig?.showProgressTracker ? weeklyStats : undefined}
      />

      {/* Info Drawer */}
      {learningContent && (
        <PredictiveInfoDrawer
          activityType={config.type}
          babyAgeDays={babyAgeDays}
          learningContent={learningContent}
          onOpenChange={setShowInfoDrawer}
          open={showInfoDrawer}
          title={config.title}
        />
      )}

      {/* Dialog */}
      <GenericSimpleActivityDialog
        babyId={babyId}
        config={config}
        initialDate={selectedDate}
        isOpen={showDialog}
        onClose={handleDialogClose}
      />

      {/* Stats Drawer */}
      <GenericSimpleActivityStatsDrawer
        activities={extendedActivities}
        config={config}
        onOpenChange={setShowStatsDrawer}
        open={showStatsDrawer}
        timeFormat={timeFormat}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog
        onOpenChange={(open) => !open && setActivityToDelete(null)}
        open={!!activityToDelete}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete {config.title} Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this {config.title.toLowerCase()} log
              entry. This action cannot be undone.
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
