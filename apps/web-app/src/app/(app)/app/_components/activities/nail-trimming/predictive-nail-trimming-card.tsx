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
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import { startOfDay, subDays } from 'date-fns';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { ACTIVITY_GOALS } from '../shared/activity-goals-registry';
import { getActivityTheme } from '../shared/activity-theme-config';
import { PredictiveInfoDrawer } from '../shared/components/predictive-cards';
import { PredictiveCardHeader } from '../shared/components/predictive-cards/predictive-card-header';
import { PredictiveProgressTrack } from '../shared/components/predictive-progress-track';
import { useWeeklyStats } from '../shared/hooks/use-weekly-stats';
import { useActivityMutations } from '../use-activity-mutations';
import {
  NailTrimmingDayGridButton,
  NailTrimmingStatsDrawer,
} from './components';
import { useNailTrimmingSevenDayActivities } from './hooks/use-nail-trimming-seven-day-activities';
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
  const [loggingLocation, setLoggingLocation] = useState<
    'hands' | 'feet' | null
  >(null);
  const [pendingDeletions, setPendingDeletions] = useState<Set<string>>(
    new Set(),
  );

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

  // Merge optimistic and server activities, then deduplicate, and filter out pending deletions
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

    const allMerged = [
      ...deduplicatedOptimistic,
      ...serverNailTrimmingActivities,
    ];

    // Filter out activities that are pending deletion
    return allMerged.filter((activity) => !pendingDeletions.has(activity.id));
  }, [optimisticActivities, serverNailTrimmingActivities, pendingDeletions]);

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
      // Remove from pending deletions after successful deletion
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.delete(activityId);
        return next;
      });
      setActivityToDelete(null);
    } catch (error) {
      console.error('Failed to delete nail trimming activity:', error);
      // Restore activity if deletion failed
      setPendingDeletions((prev) => {
        const next = new Set(prev);
        next.delete(activityId);
        return next;
      });
    }
  };

  // Calculate 7-day tracking data using location-specific hook
  const nailTrimmingData = useNailTrimmingSevenDayActivities(
    nailTrimmingActivities,
  );

  // Calculate weekly stats
  const goalConfig = ACTIVITY_GOALS.nail_trimming;
  const weeklyStats = useWeeklyStats(
    nailTrimmingActivities,
    'nail_trimming',
    goalConfig?.getWeeklyGoal ?? (() => 3),
    babyAgeDays,
    userData?.weekStartDay,
  );

  const handleLocationClick = async (
    day: (typeof nailTrimmingData)[0],
    location: 'hands' | 'feet',
  ) => {
    const existingActivity =
      location === 'hands' ? day.handsActivity : day.feetActivity;

    if (existingActivity) {
      // Optimistically remove from view immediately
      setPendingDeletions((prev) => new Set(prev).add(existingActivity.id));
      // Open delete confirmation dialog
      setActivityToDelete(existingActivity);
    } else {
      // Create new activity
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
        setLoggingLocation(location);

        const nailTrimmingDetails = {
          location,
          type: 'nail_trimming' as const,
        };

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
          id: `optimistic-nail-trimming-${Date.now()}-${location}`,
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
        console.error(`[NailTrimming] Failed to auto-log ${location}:`, error);
      } finally {
        setIsLogging(false);
        setLoggingLocation(null);
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

  const hasProgressTracker = weeklyStats && goalConfig?.showProgressTracker;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6',
          `bg-${nailTrimmingTheme.color} ${nailTrimmingTheme.textColor}`,
        )}
      >
        <PredictiveCardHeader
          icon={nailTrimmingTheme.icon}
          isFetching={false}
          onAddClick={() => {
            setShowDialog(true);
          }}
          onInfoClick={() => {
            setShowInfoDrawer(true);
          }}
          onStatsClick={() => {
            setShowStatsDrawer(true);
          }}
          showAddIcon={true}
          showStatsIcon={true}
          title="Nail Trimming"
        />

        {/* Weekly Progress Tracker (if provided) */}
        {hasProgressTracker && (
          <div className="mt-4">
            <PredictiveProgressTrack
              endLabel={`GOAL ${weeklyStats.goal}`}
              progressPercent={weeklyStats.percentage}
              srLabel={`${weeklyStats.count} of ${weeklyStats.goal} completed this week`}
              startLabel={`${weeklyStats.count} THIS WEEK`}
            />
          </div>
        )}

        {/* 7-Day Grid with custom nail trimming buttons */}
        <div className={cn('mt-6', hasProgressTracker && 'mt-4')}>
          <div className="grid grid-cols-7 gap-1.5">
            {nailTrimmingData.map((day) => (
              <NailTrimmingDayGridButton
                date={day.date}
                dateObj={day.dateObj}
                hasFeetActivity={day.hasFeetActivity}
                hasHandsActivity={day.hasHandsActivity}
                isLoggingFeet={isLogging && loggingLocation === 'feet'}
                isLoggingHands={isLogging && loggingLocation === 'hands'}
                isToday={day.isToday}
                key={day.date}
                onFeetClick={() => {
                  void handleLocationClick(day, 'feet');
                }}
                onHandsClick={() => {
                  void handleLocationClick(day, 'hands');
                }}
              />
            ))}
          </div>
        </div>
      </Card>

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
        onOpenChange={(open) => {
          if (!open) {
            // Cancel clicked - restore the activity if it was pending deletion
            if (activityToDelete) {
              setPendingDeletions((prev) => {
                const next = new Set(prev);
                next.delete(activityToDelete.id);
                return next;
              });
            }
            setActivityToDelete(null);
          }
        }}
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
