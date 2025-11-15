'use client';

import { useUser } from '@clerk/nextjs';
import type { Activities } from '@nugget/db/schema';
import { createId } from '@nugget/id';
import { toast } from '@nugget/ui/sonner';
import {
  Baby,
  Bath,
  Droplets,
  Milk,
  Moon,
  Scale,
  Thermometer,
  Timer,
  Tablet as Toilet,
} from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { ActivityDrawer } from '~/app/(app)/app/_components/activity-drawer';
import { createActivityAction } from './activity-cards.actions';
import {
  formatActivityForToast,
  getDefaultActivityData,
} from './activity-utils';
import { PredictiveDiaperCard } from './predictive-diaper-card';
import { PredictiveFeedingCard } from './predictive-feeding-card';
import { PredictivePumpingCard } from './predictive-pumping-card';
import { PredictiveSleepCard } from './predictive-sleep-card';

// All activities for drawer management
const activities = [
  {
    color: 'bg-[oklch(0.75_0.15_195)]',
    fullWidth: true,
    icon: Moon,
    id: 'sleep' as const,
    label: 'Sleep',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    fullWidth: true,
    icon: Milk,
    id: 'feeding' as const,
    label: 'Feeding',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    fullWidth: false,
    icon: Baby,
    id: 'diaper' as const,
    label: 'Diaper',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    fullWidth: false,
    icon: Toilet,
    id: 'potty' as const,
    label: 'Potty',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.70_0.16_150)]',
    fullWidth: false,
    icon: Timer,
    id: 'tummy_time' as const,
    label: 'Tummy Time',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_10)]',
    fullWidth: false,
    icon: Thermometer,
    id: 'temperature' as const,
    label: 'Temperature',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    fullWidth: false,
    icon: Scale,
    id: 'growth' as const,
    label: 'Growth',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    fullWidth: false,
    icon: Bath,
    id: 'bath' as const,
    label: 'Bath',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.65_0.18_280)]',
    fullWidth: true,
    icon: Droplets,
    id: 'pumping' as const,
    label: 'Pumping',
    textColor: 'text-white',
  },
];

interface ActivityCardsProps {
  compact?: boolean;
  onOptimisticActivity?: (activity: typeof Activities.$inferSelect) => void;
  onActivityCreated?: () => void;
  onActivityUpdated?: () => void;
}

export function ActivityCards({
  compact = false,
  onOptimisticActivity,
  onActivityCreated,
  onActivityUpdated,
}: ActivityCardsProps = {}) {
  const { user } = useUser();
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [babyAgeDays, setBabyAgeDays] = useState<number | null>(null);
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);
  const [_isPending, startTransition] = useTransition();
  const [_optimisticActivities, setOptimisticActivities] = useState<
    Array<typeof Activities.$inferSelect>
  >([]);

  useEffect(() => {
    const onboardingData = localStorage.getItem('onboardingData');
    if (onboardingData) {
      const data = JSON.parse(onboardingData);
      if (data.birthDate) {
        const birthDate = new Date(data.birthDate);
        const today = new Date();
        const diffTime = Math.abs(today.getTime() - birthDate.getTime());
        const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
        setBabyAgeDays(diffDays);
      }
    }
  }, []);

  const getVisibleActivities = () => {
    if (babyAgeDays === null) {
      // Default to newborn activities
      return activities.filter((a) =>
        ['sleep', 'feeding', 'diaper'].includes(a.id),
      );
    }

    // 0-7 days: Sleep, Feeding, Diaper
    if (babyAgeDays <= 7) {
      return activities.filter((a) =>
        ['sleep', 'feeding', 'diaper'].includes(a.id),
      );
    }

    // 8-30 days: Sleep, Feeding, Diaper, Medicine
    if (babyAgeDays <= 30) {
      return activities.filter((a) =>
        ['sleep', 'feeding', 'diaper', 'medicine'].includes(a.id),
      );
    }

    // 31-120 days: Sleep, Feeding, Diaper, Activity
    if (babyAgeDays <= 120) {
      return activities.filter((a) =>
        ['sleep', 'feeding', 'diaper', 'activity'].includes(a.id),
      );
    }

    // 121-365 days: Sleep, Feeding, Diaper, Activity
    if (babyAgeDays <= 365) {
      return activities.filter((a) =>
        ['sleep', 'feeding', 'diaper', 'activity'].includes(a.id),
      );
    }

    // 365+ days: Sleep, Feeding, Diaper, Potty
    return activities.filter((a) =>
      ['sleep', 'feeding', 'diaper', 'potty'].includes(a.id),
    );
  };

  const visibleActivities = getVisibleActivities();

  // In compact mode, show only the top 4 most important activities
  const displayActivities = compact
    ? visibleActivities.slice(0, 4)
    : visibleActivities;

  const handleQuickCreate = async (
    activityId:
      | 'sleep'
      | 'feeding'
      | 'bottle'
      | 'nursing'
      | 'pumping'
      | 'diaper'
      | 'wet'
      | 'dirty'
      | 'both'
      | 'solids'
      | 'bath'
      | 'medicine'
      | 'temperature'
      | 'tummy_time'
      | 'growth'
      | 'potty',
  ) => {
    setLoadingActivity(activityId);

    // Get baby data from localStorage for optimistic update
    const onboardingData = localStorage.getItem('onboardingData');
    let birthDate: Date | null = null;
    if (onboardingData) {
      try {
        const data = JSON.parse(onboardingData);
        birthDate = data.birthDate ? new Date(data.birthDate) : null;
      } catch (e) {
        console.error('Error parsing onboarding data:', e);
      }
    }

    // Create optimistic activity
    const optimisticData = getDefaultActivityData(activityId, birthDate);
    const optimisticActivity = {
      ...optimisticData,
      amount: null,
      babyId: 'temp',
      createdAt: new Date(),
      details: null,
      duration: null,
      endTime: null,
      feedingSource: null,
      id: createId({ prefix: 'activity-optimistic' }),
      isScheduled: false,
      notes: null,
      startTime: new Date(),
      updatedAt: new Date(),
      userId: user?.id ?? 'temp-user-id',
    } as typeof Activities.$inferSelect;

    // Add to optimistic state
    setOptimisticActivities((prev) => [...prev, optimisticActivity]);

    // Notify parent component for timeline update
    onOptimisticActivity?.(optimisticActivity);

    startTransition(async () => {
      try {
        const result = await createActivityAction({ activityType: activityId });

        if (result?.data?.activity) {
          const activity = result.data.activity;

          // Notify parent that activity was created successfully
          onActivityCreated?.();

          // Show success toast with edit action
          toast.success(formatActivityForToast(activityId, optimisticData), {
            action: {
              label: 'Edit',
              onClick: () => {
                setEditingActivity(activity);
                setOpenDrawer(activityId);
              },
            },
            description: 'Tap Edit to add more details',
            duration: 6000,
          });
        } else if (result?.serverError) {
          toast.error(result.serverError);
          // Remove optimistic activity on error
          setOptimisticActivities((prev) =>
            prev.filter((a) => a.id !== optimisticActivity.id),
          );
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create activity',
        );
        // Remove optimistic activity on error
        setOptimisticActivities((prev) =>
          prev.filter((a) => a.id !== optimisticActivity.id),
        );
      } finally {
        setLoadingActivity(null);
      }
    });
  };

  const handleDrawerClose = () => {
    setOpenDrawer(null);
    setEditingActivity(null);
  };

  const handleActivityUpdated = (
    updatedActivity: typeof Activities.$inferSelect,
  ) => {
    // Update optimistic activities if present
    setOptimisticActivities((prev) => {
      const existingIndex = prev.findIndex((a) => a.id === updatedActivity.id);
      if (existingIndex !== -1) {
        const updated = [...prev];
        updated[existingIndex] = updatedActivity;
        return updated;
      }
      return [...prev, updatedActivity];
    });

    // Notify parent component of optimistic update
    onOptimisticActivity?.(updatedActivity);
  };

  const handleActivitySaved = () => {
    // Called after server action completes successfully
    // Triggers refresh to get latest data from server
    onActivityUpdated?.();
  };

  if (compact) {
    // Compact mode: smaller buttons in a single row
    return (
      <>
        <div className="grid grid-cols-4 gap-2">
          {displayActivities.map((activity) => {
            const Icon = activity.icon;
            return (
              <button
                className={`flex flex-col items-center justify-center gap-1 p-2 rounded-lg ${activity.color} ${activity.textColor} transition-transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed`}
                disabled={loadingActivity === activity.id}
                key={activity.id}
                onClick={() => handleQuickCreate(activity.id)}
                type="button"
              >
                {loadingActivity === activity.id ? (
                  <div className="size-5 animate-spin rounded-full border-2 border-current border-t-transparent" />
                ) : (
                  <Icon className="size-5" />
                )}
                <span className="text-xs font-medium leading-none">
                  {activity.label}
                </span>
              </button>
            );
          })}
        </div>

        {activities.map((activity) => (
          <ActivityDrawer
            activity={activity}
            existingActivity={
              openDrawer === activity.id ? editingActivity : null
            }
            isOpen={openDrawer === activity.id}
            key={activity.id}
            onActivitySaved={handleActivitySaved}
            onActivityUpdated={handleActivityUpdated}
            onClose={handleDrawerClose}
          />
        ))}
      </>
    );
  }

  return (
    <>
      {/* All Action Cards Section - Predictive + Quick Actions */}
      <div className="grid grid-cols-2 gap-3 mb-6">
        <PredictiveFeedingCard
          onCardClick={() => {
            // Open unified feeding drawer for selection
            setOpenDrawer('feeding');
          }}
          refreshTrigger={onActivityCreated ? 1 : 0}
        />
        <PredictiveSleepCard
          onCardClick={() => setOpenDrawer('sleep')}
          refreshTrigger={onActivityCreated ? 1 : 0}
        />
        <PredictiveDiaperCard
          onCardClick={() => setOpenDrawer('diaper')}
          refreshTrigger={onActivityCreated ? 1 : 0}
        />
        <PredictivePumpingCard
          onCardClick={() => setOpenDrawer('pumping')}
          refreshTrigger={onActivityCreated ? 1 : 0}
        />
      </div>

      {/* Activity Drawers */}
      {activities.map((activity) => (
        <ActivityDrawer
          activity={activity}
          existingActivity={openDrawer === activity.id ? editingActivity : null}
          isOpen={openDrawer === activity.id}
          key={activity.id}
          onActivitySaved={handleActivitySaved}
          onActivityUpdated={handleActivityUpdated}
          onClose={handleDrawerClose}
        />
      ))}
    </>
  );
}
