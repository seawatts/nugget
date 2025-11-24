'use client';

import { api } from '@nugget/api/react';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
import { startOfDay } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
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
import Link from 'next/link';
import { useParams } from 'next/navigation';
import { memo, useEffect, useMemo, useState } from 'react';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { formatVolumeDisplay } from './activities/shared/volume-utils';

const activityIcons: Record<string, LucideIcon> = {
  activity: Activity,
  bath: Bath,
  bottle: Milk,
  diaper: Baby,
  feeding: Milk,
  growth: Scale,
  medicine: Pill,
  milestone: Award,
  nursing: Droplet,
  potty: Toilet,
  pumping: Droplets,
  sleep: Moon,
  solids: UtensilsCrossed,
  temperature: Thermometer,
  'tummy-time': Timer,
};

const activityColors: Record<string, string> = {
  activity: 'text-activity-tummy-time',
  bath: 'text-activity-bath',
  bottle: 'text-activity-feeding',
  diaper: 'text-activity-diaper',
  feeding: 'text-activity-feeding',
  growth: 'text-activity-growth',
  medicine: 'text-activity-medicine',
  milestone: 'text-activity-milestone',
  nursing: 'text-activity-feeding',
  potty: 'text-activity-potty',
  pumping: 'text-activity-pumping',
  sleep: 'text-activity-sleep',
  solids: 'text-activity-solids',
  temperature: 'text-activity-temperature',
  'tummy-time': 'text-activity-tummy-time',
};

const activityLabels: Record<string, string> = {
  activity: 'Activity',
  bath: 'Bath',
  bottle: 'Bottle',
  diaper: 'Diaper',
  feeding: 'Feeding',
  growth: 'Growth',
  medicine: 'Medicine',
  milestone: 'Milestones',
  nursing: 'Nursing',
  potty: 'Potty',
  pumping: 'Pumping',
  sleep: 'Sleep',
  solids: 'Solids',
  temperature: 'Temperature',
  'tummy-time': 'Tummy Time',
};

interface TodaySummaryCardProps {
  babyBirthDate?: Date | null;
  babyName?: string;
  babyPhotoUrl?: string | null;
  babyAvatarBackgroundColor?: string | null;
  measurementUnit?: 'metric' | 'imperial';
}

function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

function formatTotal(
  type: string,
  totalAmount: number,
  totalDuration: number,
  count: number,
  unitPref: 'ML' | 'OZ' = 'ML',
): string {
  switch (type) {
    case 'feeding': {
      if (totalAmount === 0) return unitPref === 'OZ' ? '0 oz' : '0 ml';
      return formatVolumeDisplay(totalAmount, unitPref, true);
    }
    case 'sleep': {
      if (totalDuration === 0) return '0 min';
      return formatDuration(totalDuration);
    }
    case 'diaper': {
      return `${count} ${count === 1 ? 'change' : 'changes'}`;
    }
    case 'pumping': {
      if (totalAmount === 0) return unitPref === 'OZ' ? '0 oz' : '0 ml';
      return formatVolumeDisplay(totalAmount, unitPref, true);
    }
    case 'tummy-time': {
      if (totalDuration === 0) return '0 min';
      return formatDuration(totalDuration);
    }
    case 'bath': {
      return `${count} ${count === 1 ? 'time' : 'times'}`;
    }
    case 'milestone': {
      return `${count}`;
    }
    default:
      return `${count}`;
  }
}

// Memoized component to prevent parent re-renders when age updates
const LiveBabyAge = memo(({ birthDate }: { birthDate: Date }) => {
  const [age, setAge] = useState('');

  useEffect(() => {
    function updateAge() {
      const now = new Date();
      const birth = new Date(birthDate);
      const diffMs = now.getTime() - birth.getTime();

      const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
      const hours = Math.floor(
        (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60),
      );
      const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
      const seconds = Math.floor((diffMs % (1000 * 60)) / 1000);

      if (days > 0) {
        setAge(`${days}d ${hours}h ${minutes}m ${seconds}s`);
      } else if (hours > 0) {
        setAge(`${hours}h ${minutes}m ${seconds}s`);
      } else if (minutes > 0) {
        setAge(`${minutes}m ${seconds}s`);
      } else {
        setAge(`${seconds}s`);
      }
    }

    updateAge();
    const interval = setInterval(updateAge, 1000); // Update every second

    return () => clearInterval(interval);
  }, [birthDate]);

  return <>{age}</>;
});

LiveBabyAge.displayName = 'LiveBabyAge';

export function TodaySummaryCard({
  babyBirthDate,
  babyName,
  babyPhotoUrl,
  babyAvatarBackgroundColor,
  measurementUnit = 'metric',
}: TodaySummaryCardProps) {
  // Get babyId from params (TodaySummaryCard is only used on dashboard which has babyId in URL)
  const params = useParams();
  const babyId = params.babyId as string;

  // Determine volume unit based on measurement preference
  const userUnitPref = measurementUnit === 'imperial' ? 'OZ' : 'ML';

  // Get shared data from dashboard store (populated by DashboardContainer)
  const activitiesData = useDashboardDataStore.use.activities();

  // Fetch milestones achieved today using tRPC suspense query (prefetched on server)
  // Use babyId from params to avoid race condition with store population
  const [allMilestones = []] = api.milestones.list.useSuspenseQuery({
    babyId: babyId ?? '',
    limit: 100,
  });

  // Filter to only today's activities and milestones
  const todayStart = useMemo(() => startOfDay(new Date()), []);

  const todayActivities = useMemo(() => {
    return activitiesData.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= todayStart;
    });
  }, [activitiesData, todayStart]);

  const milestonesData = useMemo(() => {
    return allMilestones.filter((milestone) => {
      if (!milestone.achievedDate) return false;
      const achievedDate = new Date(milestone.achievedDate);
      return achievedDate >= todayStart;
    });
  }, [allMilestones, todayStart]);

  // Get optimistic activities from Zustand store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Merge optimistic activities with loaded activities
  const allActivities = useMemo(() => {
    // Filter optimistic activities to only include today's activities
    const todaysOptimistic = optimisticActivities.filter((activity) => {
      const activityDate = new Date(activity.startTime);
      return activityDate >= todayStart;
    });

    // Deduplicate optimistic activities - remove optimistic items if a matching real activity exists
    const deduplicatedOptimistic = todaysOptimistic.filter(
      (optimisticActivity) => {
        // Check if there's a matching real activity (same type, similar timestamp)
        const hasMatchingRealActivity = todayActivities.some((realActivity) => {
          // Match by type and timestamp (within 1 second tolerance)
          if (realActivity.type !== optimisticActivity.type) return false;

          const timeDiff = Math.abs(
            new Date(realActivity.startTime).getTime() -
              new Date(optimisticActivity.startTime).getTime(),
          );

          return timeDiff <= 1000; // 1 second tolerance
        });

        // Keep optimistic activity only if no matching real activity exists
        return !hasMatchingRealActivity;
      },
    );

    return [...deduplicatedOptimistic, ...todayActivities];
  }, [optimisticActivities, todayActivities, todayStart]);

  // Map activity types to display categories
  const mapActivityTypeToCategory = (type: string): string => {
    // Feeding variants
    if (type === 'feeding' || type === 'bottle' || type === 'nursing') {
      return 'feeding';
    }
    // Diaper variants
    if (
      type === 'diaper' ||
      type === 'wet' ||
      type === 'dirty' ||
      type === 'both'
    ) {
      return 'diaper';
    }
    // Tummy time conversion (underscore to dash)
    if (type === 'tummy_time') {
      return 'tummy-time';
    }
    // Everything else passes through as-is
    return type;
  };

  // Group activities by category, tracking count and totals
  const activitySummaries = allActivities.reduce(
    (acc, activity) => {
      const category = mapActivityTypeToCategory(activity.type);
      if (!acc[category]) {
        acc[category] = {
          count: 1,
          totalAmount: activity.amountMl || 0,
          totalDuration: activity.duration || 0,
        };
      } else {
        acc[category].count += 1;
        acc[category].totalDuration += activity.duration || 0;
        acc[category].totalAmount += activity.amountMl || 0;
      }
      return acc;
    },
    {} as Record<
      string,
      {
        count: number;
        totalDuration: number;
        totalAmount: number;
      }
    >,
  );

  // Define the fixed categories to display
  const displayCategories = [
    'feeding',
    'sleep',
    'diaper',
    'tummy-time',
    'pumping',
    'milestone',
  ];

  // Ensure all categories exist with default values
  const categorySummaries = displayCategories.map((category) => {
    // Special handling for milestones
    if (category === 'milestone') {
      return {
        category,
        summary: {
          count: milestonesData.length,
          totalAmount: 0,
          totalDuration: 0,
        },
      };
    }

    return {
      category,
      summary: activitySummaries[category] || {
        count: 0,
        totalAmount: 0,
        totalDuration: 0,
      },
    };
  });

  return (
    <div className="rounded-xl border border-border bg-linear-to-br from-card/50 to-card/80 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <Link
            className="relative flex items-center justify-center size-9 rounded-full bg-linear-to-br from-primary to-primary/80 p-[2px] shadow-md shadow-primary/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
            href="/app/settings/baby"
          >
            <div className="size-full rounded-full bg-card flex items-center justify-center p-0.5">
              <NuggetAvatar
                backgroundColor={babyAvatarBackgroundColor || undefined}
                image={
                  !babyAvatarBackgroundColor && babyPhotoUrl
                    ? babyPhotoUrl
                    : undefined
                }
                name={babyName}
                size="sm"
              />
            </div>
          </Link>
          <div className="flex flex-col">
            <h2 className="text-lg font-semibold text-foreground leading-tight">
              {babyName ? `${babyName}'s Day` : "Today's Summary"}
            </h2>
            {babyBirthDate && (
              <span className="text-xs text-muted-foreground font-mono leading-tight">
                <LiveBabyAge birthDate={babyBirthDate} />
              </span>
            )}
          </div>
        </div>
        <span className="text-sm text-muted-foreground font-medium">
          {allActivities.length}{' '}
          {allActivities.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
        {categorySummaries.map(({ category, summary }) => {
          const Icon = activityIcons[category] || Baby;
          const colorClass = activityColors[category] || 'text-primary';
          const label = activityLabels[category] || category;
          const total = formatTotal(
            category,
            summary.totalAmount,
            summary.totalDuration,
            summary.count,
            userUnitPref,
          );

          return (
            <div
              className="flex items-start gap-2.5 p-3 rounded-lg bg-card/60 border border-border/50"
              key={category}
            >
              <div className="shrink-0 p-2 rounded-full bg-muted/40 self-start">
                <Icon className={`size-4 ${colorClass}`} />
              </div>
              <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                <p className="text-xs text-muted-foreground leading-tight">
                  {label}
                </p>
                <p className="text-sm font-semibold text-foreground leading-tight">
                  {total}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
