'use client';

import { useUser } from '@clerk/nextjs';
import type { Activities } from '@nugget/db/schema';
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
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { createActivityAction } from './activity-cards.actions';
import { ActivityDrawer } from './activity-drawer';
import { PredictiveDiaperCard } from './diaper/predictive-diaper-card';
import { PredictiveFeedingCard } from './feeding/predictive-feeding-card';
import { PredictivePumpingCard } from './pumping/predictive-pumping-card';
import {
  formatActivityForToast,
  getDefaultActivityData,
} from './shared/activity-utils';
import { PredictiveSleepCard } from './sleep/predictive-sleep-card';

// All activities for drawer management
const activities = [
  {
    color: 'bg-activity-sleep',
    fullWidth: true,
    icon: Moon,
    id: 'sleep' as const,
    label: 'Sleep',
    textColor: 'text-activity-sleep-foreground',
  },
  {
    color: 'bg-activity-feeding',
    fullWidth: true,
    icon: Milk,
    id: 'feeding' as const,
    label: 'Feeding',
    textColor: 'text-activity-feeding-foreground',
  },
  {
    color: 'bg-activity-diaper',
    fullWidth: false,
    icon: Baby,
    id: 'diaper' as const,
    label: 'Diaper',
    textColor: 'text-activity-diaper-foreground',
  },
  {
    color: 'bg-activity-potty',
    fullWidth: false,
    icon: Toilet,
    id: 'potty' as const,
    label: 'Potty',
    textColor: 'text-activity-potty-foreground',
  },
  {
    color: 'bg-activity-tummy-time',
    fullWidth: false,
    icon: Timer,
    id: 'tummy_time' as const,
    label: 'Tummy Time',
    textColor: 'text-activity-tummy-time-foreground',
  },
  {
    color: 'bg-activity-temperature',
    fullWidth: false,
    icon: Thermometer,
    id: 'temperature' as const,
    label: 'Temperature',
    textColor: 'text-activity-temperature-foreground',
  },
  {
    color: 'bg-activity-growth',
    fullWidth: false,
    icon: Scale,
    id: 'growth' as const,
    label: 'Growth',
    textColor: 'text-activity-growth-foreground',
  },
  {
    color: 'bg-activity-bath',
    fullWidth: false,
    icon: Bath,
    id: 'bath' as const,
    label: 'Bath',
    textColor: 'text-activity-bath-foreground',
  },
  {
    color: 'bg-activity-pumping',
    fullWidth: true,
    icon: Droplets,
    id: 'pumping' as const,
    label: 'Pumping',
    textColor: 'text-activity-pumping-foreground',
  },
];

interface ActivityCardsProps {
  compact?: boolean;
}

export function ActivityCards({ compact = false }: ActivityCardsProps = {}) {
  const { user } = useUser();
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [babyAgeDays, setBabyAgeDays] = useState<number | null>(null);
  const [loadingActivity, setLoadingActivity] = useState<string | null>(null);
  const [_isPending, startTransition] = useTransition();

  // Use Zustand store for optimistic updates
  const addOptimisticActivity = useOptimisticActivitiesStore(
    (state) => state.addActivity,
  );

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
      id: `temp-activity-${Date.now()}`,
      isScheduled: false,
      notes: null,
      startTime: new Date(),
      updatedAt: new Date(),
      userId: user?.id ?? 'temp-user-id',
    } as typeof Activities.$inferSelect;

    // Add to Zustand optimistic state
    addOptimisticActivity(optimisticActivity);

    startTransition(async () => {
      try {
        const result = await createActivityAction({ activityType: activityId });

        if (result?.data?.activity) {
          const activity = result.data.activity;

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
          // Note: Optimistic activity will be automatically cleared by mutation hook on success
          // or can be manually removed on error if needed
        }
      } catch (error) {
        toast.error(
          error instanceof Error ? error.message : 'Failed to create activity',
        );
        // Note: Optimistic activity will be automatically cleared by mutation hook on success
        // or can be manually removed on error if needed
      } finally {
        setLoadingActivity(null);
      }
    });
  };

  const handleDrawerClose = () => {
    setOpenDrawer(null);
    setEditingActivity(null);
  };

  const handleActivityLogged = (activity: typeof Activities.$inferSelect) => {
    // When a quick log button is pressed on a predictive card:
    // Add optimistic activity to Zustand store for immediate feedback
    // tRPC will handle cache invalidation and clearing optimistic state after mutation completes
    addOptimisticActivity(activity);
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
          onActivityLogged={handleActivityLogged}
          onCardClick={() => {
            // Open unified feeding drawer for selection
            setOpenDrawer('feeding');
          }}
        />
        <PredictiveSleepCard
          onActivityLogged={handleActivityLogged}
          onCardClick={() => setOpenDrawer('sleep')}
        />
        <PredictiveDiaperCard
          onActivityLogged={handleActivityLogged}
          onCardClick={() => setOpenDrawer('diaper')}
        />
        <PredictivePumpingCard
          onActivityLogged={handleActivityLogged}
          onCardClick={() => setOpenDrawer('pumping')}
        />
      </div>

      {/* Activity Drawers */}
      {activities.map((activity) => (
        <ActivityDrawer
          activity={activity}
          existingActivity={openDrawer === activity.id ? editingActivity : null}
          isOpen={openDrawer === activity.id}
          key={activity.id}
          onClose={handleDrawerClose}
        />
      ))}
    </>
  );
}
