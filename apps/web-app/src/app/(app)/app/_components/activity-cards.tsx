'use client';

import { useUser } from '@clerk/nextjs';
import type { Activities } from '@nugget/db/schema';
import { createId } from '@nugget/id';
import { toast } from '@nugget/ui/sonner';
import {
  Activity,
  Baby,
  Bath,
  Droplet,
  Droplets,
  Milk,
  Moon,
  Pill,
  Scale,
  Thermometer,
  Timer,
  Tablet as Toilet,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useState, useTransition } from 'react';
import { ActivityDrawer } from '~/app/(app)/app/_components/activity-drawer';
import { ActivityCard } from './activity-card';
import { createActivityAction } from './activity-cards.actions';
import {
  formatActivityForToast,
  getDefaultActivityData,
} from './activity-utils';

const activities = [
  {
    color: 'bg-[oklch(0.75_0.15_195)]',
    fullWidth: true,
    icon: Moon,
    id: 'sleep',
    label: 'Sleep',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    fullWidth: false,
    icon: Droplet,
    id: 'nursing',
    label: 'Nursing',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    fullWidth: false,
    icon: Milk,
    id: 'bottle',
    label: 'Bottle',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.72_0.16_330)]',
    fullWidth: true,
    icon: UtensilsCrossed,
    id: 'solids',
    label: 'Solids',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    fullWidth: false,
    icon: Baby,
    id: 'diaper',
    label: 'Diaper',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    fullWidth: false,
    icon: Toilet,
    id: 'potty',
    label: 'Potty',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.65_0.18_280)]',
    fullWidth: true,
    icon: Droplets,
    id: 'pumping',
    label: 'Pumping',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.70_0.16_150)]',
    fullWidth: false,
    icon: Activity,
    id: 'activity',
    label: 'Activity',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.70_0.16_150)]',
    fullWidth: false,
    icon: Timer,
    id: 'tummy-time',
    label: 'Tummy Time',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_10)]',
    fullWidth: false,
    icon: Pill,
    id: 'medicine',
    label: 'Medicine',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_10)]',
    fullWidth: false,
    icon: Thermometer,
    id: 'temperature',
    label: 'Temperature',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    fullWidth: false,
    icon: Scale,
    id: 'growth',
    label: 'Growth',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    fullWidth: false,
    icon: Bath,
    id: 'bath',
    label: 'Bath',
    textColor: 'text-white',
  },
];

export function ActivityCards() {
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
      return activities;
    }

    if (babyAgeDays <= 3) {
      return activities.filter((a) =>
        ['sleep', 'nursing', 'bottle', 'diaper'].includes(a.id),
      );
    }

    if (babyAgeDays <= 7) {
      return activities.filter((a) =>
        [
          'sleep',
          'nursing',
          'bottle',
          'diaper',
          'pumping',
          'medicine',
          'temperature',
        ].includes(a.id),
      );
    }

    if (babyAgeDays <= 30) {
      return activities.filter((a) =>
        [
          'sleep',
          'nursing',
          'bottle',
          'diaper',
          'pumping',
          'medicine',
          'temperature',
          'growth',
          'bath',
        ].includes(a.id),
      );
    }

    if (babyAgeDays <= 60) {
      return activities.filter((a) =>
        [
          'sleep',
          'nursing',
          'bottle',
          'diaper',
          'pumping',
          'tummy-time',
          'activity',
          'medicine',
          'temperature',
          'growth',
          'bath',
        ].includes(a.id),
      );
    }

    if (babyAgeDays <= 120) {
      return activities.filter((a) =>
        [
          'sleep',
          'nursing',
          'bottle',
          'diaper',
          'pumping',
          'tummy-time',
          'activity',
          'medicine',
          'temperature',
          'growth',
          'bath',
        ].includes(a.id),
      );
    }

    if (babyAgeDays <= 365) {
      return activities.filter((a) =>
        [
          'sleep',
          'nursing',
          'bottle',
          'solids',
          'diaper',
          'pumping',
          'tummy-time',
          'activity',
          'medicine',
          'temperature',
          'growth',
          'bath',
        ].includes(a.id),
      );
    }

    return activities;
  };

  const visibleActivities = getVisibleActivities();

  const handleQuickCreate = async (activityId: string) => {
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

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {visibleActivities.map((activity) => {
          return (
            <ActivityCard
              activity={activity}
              isLoading={loadingActivity === activity.id}
              key={activity.id}
              onClick={() => handleQuickCreate(activity.id)}
            />
          );
        })}
      </div>

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
