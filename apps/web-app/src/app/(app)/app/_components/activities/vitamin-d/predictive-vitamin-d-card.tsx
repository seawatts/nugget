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
import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
import { format, startOfDay, subDays } from 'date-fns';
import { Check, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { getActivityTheme } from '../shared/activity-theme-config';
import {
  PredictiveCardHeader,
  PredictiveInfoDrawer,
} from '../shared/components/predictive-cards';
import { formatDayAbbreviation } from '../shared/components/stats';
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
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [activityToDelete, setActivityToDelete] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [isLogging, setIsLogging] = useState(false);

  const vitaminDTheme = getActivityTheme('vitamin_d');

  // Get shared data from dashboard store (populated by DashboardContainer)
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

  // Filter activities to only vitamin D from the shared data (already fetched 30 days)
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

  // Calculate 7-day tracking data
  const vitaminDData = (() => {
    const startOfDayNow = startOfDay(new Date());
    const days: Array<{
      date: string;
      dateObj: Date;
      displayDate: string;
      hasVitaminD: boolean;
      activity?: typeof Activities.$inferSelect;
    }> = [];

    for (let i = 6; i >= 0; i--) {
      const date = subDays(startOfDayNow, i);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

      // Check if vitamin D was logged on this day
      const activity = vitaminDActivities.find((act) => {
        const activityDate = new Date(act.startTime);
        const activityDateKey = format(activityDate, 'yyyy-MM-dd');
        const matches = activityDateKey === dateKey;
        return matches;
      });

      days.push({
        activity,
        date: dateKey,
        dateObj: date,
        displayDate: `${dayName} ${monthDay}`,
        hasVitaminD: !!activity,
      });
    }

    return days;
  })();

  const handleDayClick = async (day: (typeof vitaminDData)[0]) => {
    if (day.hasVitaminD && day.activity) {
      // Show delete confirmation
      setActivityToDelete(day.activity);
    } else {
      // Auto-log vitamin D for this date
      // Parse the date string and apply current time to the selected day
      const parts = day.date.split('-').map(Number);
      const year = parts[0] ?? 0;
      const month = parts[1] ?? 1;
      const dayNum = parts[2] ?? 1;
      const now = new Date();
      const normalizedDate = new Date(
        year,
        month - 1,
        dayNum,
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

  const handleAddClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowDialog(true);
  };

  const handleInfoClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowInfoDrawer(true);
  };

  const handleStatsClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    setShowStatsDrawer(true);
  };

  // Get learning content for the baby's age
  const learningContent =
    babyAgeDays !== null ? getVitaminDLearningContent(babyAgeDays) : null;

  return (
    <>
      <Card
        className={cn(
          'relative overflow-hidden p-6',
          `bg-${vitaminDTheme.color} ${vitaminDTheme.textColor}`,
        )}
      >
        <PredictiveCardHeader
          icon={vitaminDTheme.icon}
          isFetching={false}
          onAddClick={handleAddClick}
          onInfoClick={handleInfoClick}
          onStatsClick={handleStatsClick}
          showAddIcon={true}
          showStatsIcon={true}
          title="Vitamin D"
        />

        {/* 7-Day Tracking Grid */}
        <div className="mt-6">
          <div className="grid grid-cols-7 gap-2">
            {vitaminDData.map((day) => {
              const dayAbbr = formatDayAbbreviation(day.dateObj);

              return (
                <button
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all',
                    'hover:bg-black/10',
                    day.hasVitaminD ? 'bg-black/10' : 'bg-black/5',
                    isLogging && 'opacity-50 cursor-wait',
                  )}
                  disabled={isLogging}
                  key={day.date}
                  onClick={(e) => {
                    e.stopPropagation();
                    void handleDayClick(day);
                  }}
                  type="button"
                >
                  <span className="text-xs font-semibold opacity-90">
                    {dayAbbr}
                  </span>
                  <div
                    className={cn(
                      'flex size-10 items-center justify-center rounded-full transition-all',
                      day.hasVitaminD
                        ? 'bg-primary shadow-md'
                        : 'bg-white/60 shadow-sm',
                    )}
                  >
                    {day.hasVitaminD ? (
                      <Check
                        className="size-5 text-primary-foreground"
                        strokeWidth={3}
                      />
                    ) : (
                      <X className="size-5 text-red-600" strokeWidth={3} />
                    )}
                  </div>
                </button>
              );
            })}
          </div>
        </div>
      </Card>

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
        activities={vitaminDActivities}
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
