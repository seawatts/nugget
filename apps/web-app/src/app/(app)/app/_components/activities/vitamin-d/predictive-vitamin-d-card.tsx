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
import { format, startOfDay, subDays } from 'date-fns';
import { Check, X } from 'lucide-react';
import { useParams } from 'next/navigation';
import { useMemo, useState } from 'react';
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

  const vitaminDTheme = getActivityTheme('vitamin_d');

  // Get baby data for age-based learning content
  const { data: baby } = api.babies.getByIdLight.useQuery(
    { id: babyId },
    { enabled: !!babyId },
  );

  const { data: userData } = api.user.current.useQuery();
  const timeFormat = userData?.timeFormat || '12h';

  const babyAgeDays = baby?.birthDate
    ? Math.floor(
        (Date.now() - new Date(baby.birthDate).getTime()) /
          (1000 * 60 * 60 * 24),
      )
    : null;

  // Get optimistic activities from store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Fetch last 30 days of vitamin D activities
  const thirtyDaysAgo = useMemo(() => startOfDay(subDays(new Date(), 30)), []);
  const { data: serverVitaminDActivities = [], isFetching } =
    api.activities.list.useQuery({
      babyId,
      limit: 1000,
      since: thirtyDaysAgo,
      type: 'vitamin_d',
    });

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
  const { deleteActivity: deleteActivityMutation, isDeleting } =
    useActivityMutations();

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
    const now = new Date();
    const days: Array<{
      date: string;
      displayDate: string;
      hasVitaminD: boolean;
      activity?: typeof Activities.$inferSelect;
    }> = [];

    console.log(
      '[VitaminD Card] Calculating 7-day data, total activities:',
      vitaminDActivities.length,
    );

    for (let i = 6; i >= 0; i--) {
      const date = new Date(now.getTime() - i * 24 * 60 * 60 * 1000);
      const dateKey = format(date, 'yyyy-MM-dd');
      const dayName = date.toLocaleDateString('en-US', { weekday: 'short' });
      const monthDay = `${date.getMonth() + 1}/${date.getDate()}`;

      // Check if vitamin D was logged on this day
      const activity = vitaminDActivities.find((act) => {
        const activityDate = new Date(act.startTime);
        const activityDateKey = format(activityDate, 'yyyy-MM-dd');
        const matches = activityDateKey === dateKey;
        if (matches) {
          console.log('[VitaminD Card] Match found:', {
            activityDateKey,
            activityId: act.id,
            dateKey,
          });
        }
        return matches;
      });

      days.push({
        activity,
        date: dateKey,
        displayDate: `${dayName} ${monthDay}`,
        hasVitaminD: !!activity,
      });
    }

    console.log(
      '[VitaminD Card] Days data:',
      days.map((d) => ({ date: d.date, hasVitaminD: d.hasVitaminD })),
    );

    return days;
  })();

  const handleDayClick = (day: (typeof vitaminDData)[0]) => {
    if (day.hasVitaminD && day.activity) {
      // Show delete confirmation
      setActivityToDelete(day.activity);
    } else {
      // Open dialog to log for this date
      // Parse the date string as local date at noon to avoid timezone issues
      const parts = day.date.split('-').map(Number);
      const year = parts[0] ?? 0;
      const month = parts[1] ?? 1;
      const dayNum = parts[2] ?? 1;
      const localDate = new Date(year, month - 1, dayNum, 12, 0, 0);
      console.log(
        '[VitaminD Card] Clicked day:',
        day.date,
        '→ Local date:',
        localDate,
      );
      setSelectedDate(localDate);
      setShowDialog(true);
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

  const handleCardClick = () => {
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
          'relative overflow-hidden p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
          `bg-${vitaminDTheme.color} ${vitaminDTheme.textColor}`,
        )}
        onClick={handleCardClick}
      >
        <PredictiveCardHeader
          icon={vitaminDTheme.icon}
          isFetching={isFetching}
          onInfoClick={handleInfoClick}
          onStatsClick={handleStatsClick}
          showStatsIcon={true}
          title="Vitamin D"
        >
          <div className="text-sm opacity-60">Daily supplement tracking</div>
        </PredictiveCardHeader>

        {/* 7-Day Tracking Grid */}
        <div className="mt-6">
          <div className="grid grid-cols-7 gap-2">
            {vitaminDData.map((day) => {
              const date = new Date(day.date);
              const dayAbbr = formatDayAbbreviation(date);

              return (
                <button
                  className={cn(
                    'flex flex-col items-center gap-1.5 p-2 rounded-lg transition-all',
                    'hover:bg-black/10',
                    day.hasVitaminD ? 'bg-black/10' : 'bg-black/5',
                  )}
                  key={day.date}
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDayClick(day);
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
