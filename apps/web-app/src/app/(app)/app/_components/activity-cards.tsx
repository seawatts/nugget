'use client';

import { Card } from '@nugget/ui/card';
import { cn } from '@nugget/ui/lib/utils';
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
import { useEffect, useState } from 'react';
import { ActivityDrawer } from '~/app/(app)/app/_components/activity-drawer';

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
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [babyAgeDays, setBabyAgeDays] = useState<number | null>(null);

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

  return (
    <>
      <div className="grid grid-cols-2 gap-3">
        {visibleActivities.map((activity) => {
          const Icon = activity.icon;
          return (
            <Card
              className={cn(
                'relative overflow-hidden border-0 p-6 transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer',
                activity.color,
                activity.fullWidth && 'col-span-2',
              )}
              key={activity.id}
              onClick={() => setOpenDrawer(activity.id)}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className={cn('opacity-30', activity.textColor)}>
                    <Icon className="h-12 w-12" strokeWidth={1.5} />
                  </div>
                  <h2 className={cn('text-2xl font-bold', activity.textColor)}>
                    {activity.label}
                  </h2>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {activities.map((activity) => (
        <ActivityDrawer
          activity={activity}
          isOpen={openDrawer === activity.id}
          key={activity.id}
          onClose={() => setOpenDrawer(null)}
        />
      ))}
    </>
  );
}
