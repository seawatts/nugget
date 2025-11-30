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
import { VitaminDStatsDrawer } from './components';
import { getVitaminDLearningContent } from './learning-content';
import { VitaminDDialog } from './vitamin-d-dialog';

interface PredictiveVitaminDCardProps {
  onActivityLogged?: (activity: typeof Activities.$inferSelect) => void;
}

export function PredictiveVitaminDCard({
  onActivityLogged,
}: PredictiveVitaminDCardProps) {
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

  const vitaminDTheme = getActivityTheme('vitamin_d');

  // Get shared data from dashboard store
  const baby = useDashboardDataStore.use.baby();
  const userData = useDashboardDataStore.use.user();

  const timeFormat = userData?.timeFormat || '12h';

  const babyAgeDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - new Date(baby.birthDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Get activities from dashboard store
  const allActivities = useDashboardDataStore.use.activities();

  // Get optimistic activities from store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

  // Filter activities to only vitamin D
  const serverVitaminDActivities = useMemo(() => {
    return (
      allActivities?.filter((activity) => activity.type === 'vitamin_d') ?? []
    );
  }, [allActivities]);

  // Merge optimistic and server activities, then deduplicate
  const vitaminDActivities = useMemo(() => {
    // Filter optimistic activities to only vitamin D type
    const optimisticVitaminD = optimisticActivities.filter(
      (activity) => activity.type === 'vitamin_d',
    );

    // Deduplicate optimistic activities - remove optimistic items if a matching real activity exists
    const deduplicatedOptimistic = optimisticVitaminD.filter(
      (optimisticActivity) => {
        // Check if there's a matching real activity (same type, similar timestamp)
        const hasMatchingRealActivity = serverVitaminDActivities.some(
          (realActivity) => {
            // Match by timestamp (within 1 second tolerance)
            const timeDiff = Math.abs(
              new Date(realActivity.startTime).getTime() -
                new Date(optimisticActivity.startTime).getTime(),
            );

            return timeDiff <= 1000; // 1 second tolerance
          },
        );

        // Keep optimistic activity only if no matching real activity exists
        return !hasMatchingRealActivity;
      },
    );

    return [...deduplicatedOptimistic, ...serverVitaminDActivities];
  }, [optimisticActivities, serverVitaminDActivities]);

  // Use centralized mutations hook for automatic cache invalidation
  const {
    deleteActivity: deleteActivityMutation,
    createActivity,
    isDeleting,
  } = useActivityMutations();

  const handleDeleteActivity = async (activityId: string) => {
    const activityToNotify = activityToDelete;
    try {
      await deleteActivityMutation(activityId);
      // Notify parent of deleted activity if callback provided
      if (activityToNotify && onActivityLogged) {
        onActivityLogged(activityToNotify);
      }
      setActivityToDelete(null);
    } catch (error) {
      // Error handling is done by useActivityMutations hook
      console.error('Failed to delete vitamin D activity:', error);
    }
  };

  // Calculate 7-day tracking data using shared hook
  const vitaminDData = useSevenDayActivities(vitaminDActivities, 'vitamin_d');

  // Calculate weekly stats
  const goalConfig = ACTIVITY_GOALS.vitamin_d;
  const weeklyStats = useWeeklyStats(
    vitaminDActivities,
    'vitamin_d',
    goalConfig?.getWeeklyGoal ?? (() => 7),
    babyAgeDays,
    userData?.weekStartDay,
  );

  const handleDayClick = async (day: (typeof vitaminDData)[0]) => {
    if (day.hasActivity && day.activity) {
      // Show delete confirmation
      setActivityToDelete(day.activity);
    } else {
      // Auto-log vitamin D for this date
      // Use the dateObj from the day and apply current time
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

        // Vitamin D details without method (quick log)
        const vitaminDDetails = { type: 'vitamin_d' as const };

        // Create optimistic activity for immediate UI feedback
        const optimisticActivity = {
          amountMl: null,
          assignedUserId: null,
          babyId: babyId,
          createdAt: normalizedDate,
          details: vitaminDDetails,
          duration: null,
          endTime: normalizedDate,
          familyId: 'temp',
          familyMemberId: null,
          feedingSource: null,
          id: `optimistic-vitamin-d-${Date.now()}`,
          isScheduled: false,
          notes: null,
          startTime: normalizedDate,
          subjectType: 'baby' as const,
          type: 'vitamin_d' as const,
          updatedAt: normalizedDate,
          userId: 'temp',
        } as typeof Activities.$inferSelect;

        // Add to optimistic store immediately
        addOptimisticActivity(optimisticActivity);

        // Create actual activity in the background
        await createActivity({
          activityType: 'vitamin_d',
          babyId,
          details: vitaminDDetails,
          startTime: normalizedDate,
        });
      } catch (error) {
        console.error('[VitaminD] Failed to auto-log vitamin D:', error);
      } finally {
        setIsLogging(false);
      }
    }
  };

  const handleDialogClose = (_wasLogged: boolean) => {
    setShowDialog(false);
    setSelectedDate(null);
    // Note: useActivityMutations handles cache invalidation automatically
    // We don't call onActivityLogged here because we don't have the activity reference
    // The cache invalidation will trigger a refetch which will update the UI
  };

  const handleConfirmDelete = () => {
    if (activityToDelete) {
      void handleDeleteActivity(activityToDelete.id);
    }
  };

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getVitaminDLearningContent(babyAgeDays) : null;

  return (
    <>
      <BasePredictiveCard
        activityType="vitamin_d"
        icon={vitaminDTheme.icon}
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
        sevenDayData={vitaminDData}
        theme={vitaminDTheme}
        title="Vitamin D"
        weeklyStats={goalConfig?.showProgressTracker ? weeklyStats : undefined}
      />

      {/* Info Drawer */}
      <PredictiveInfoDrawer
        activityType="vitamin_d"
        babyAgeDays={babyAgeDays}
        learningContent={learningContent}
        onOpenChange={setShowInfoDrawer}
        open={showInfoDrawer}
        title="Vitamin D"
      />

      {/* Quick Log Dialog */}
      <VitaminDDialog
        babyId={babyId}
        initialDate={selectedDate}
        isOpen={showDialog}
        onClose={handleDialogClose}
      />

      {/* Stats Drawer */}
      <VitaminDStatsDrawer
        activities={extendedActivities}
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
            <AlertDialogTitle>Delete Vitamin D Activity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete this vitamin D log entry. This action
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
