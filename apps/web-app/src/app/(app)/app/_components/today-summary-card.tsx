'use client';

import { api } from '@nugget/api/react';
import type { Activities, Milestone } from '@nugget/db/schema';
import { NuggetAvatar } from '@nugget/ui/custom/nugget-avatar';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTodaySummaryAction } from './today-summary.actions';
import { formatVolumeDisplay, getVolumeUnit } from './volume-utils';

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
  activity: 'text-[oklch(0.70_0.16_150)]',
  bath: 'text-[oklch(0.62_0.18_260)]',
  bottle: 'text-[oklch(0.68_0.18_35)]',
  diaper: 'text-[oklch(0.78_0.14_60)]',
  feeding: 'text-[oklch(0.68_0.18_35)]',
  growth: 'text-[oklch(0.62_0.18_260)]',
  medicine: 'text-[oklch(0.68_0.18_10)]',
  milestone: 'text-[oklch(0.75_0.18_140)]',
  nursing: 'text-[oklch(0.68_0.18_35)]',
  potty: 'text-[oklch(0.78_0.14_60)]',
  pumping: 'text-[oklch(0.65_0.18_280)]',
  sleep: 'text-[oklch(0.75_0.15_195)]',
  solids: 'text-[oklch(0.72_0.16_330)]',
  temperature: 'text-[oklch(0.68_0.18_10)]',
  'tummy-time': 'text-[oklch(0.70_0.16_150)]',
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
  optimisticActivities?: Array<typeof Activities.$inferSelect>;
  refreshTrigger?: number;
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
    case 'bath':
    case 'milestone': {
      return `${count} ${count === 1 ? 'time' : 'times'}`;
    }
    default:
      return `${count}`;
  }
}

function LiveBabyAge({ birthDate }: { birthDate: Date }) {
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

      if (days > 0) {
        setAge(`${days}d ${hours}h`);
      } else if (hours > 0) {
        setAge(`${hours}h`);
      } else {
        const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
        setAge(`${minutes}m`);
      }
    }

    updateAge();
    const interval = setInterval(updateAge, 60000); // Update every minute

    return () => clearInterval(interval);
  }, [birthDate]);

  return <>{age}</>;
}

export function TodaySummaryCard({
  babyBirthDate,
  babyName,
  babyPhotoUrl,
  optimisticActivities = [],
  refreshTrigger = 0,
}: TodaySummaryCardProps) {
  const [activitiesData, setActivitiesData] = useState<
    Array<typeof Activities.$inferSelect>
  >([]);
  const [milestonesData, setMilestonesData] = useState<Array<Milestone>>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Fetch user preferences for volume display
  const { data: user } = api.user.current.useQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');

  const loadTodaySummary = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getTodaySummaryAction();

      if (result?.data) {
        setActivitiesData(result.data.activities);
        setMilestonesData(result.data.milestones);
      } else if (result?.serverError) {
        setError(result.serverError);
      }
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'Failed to load today summary',
      );
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadTodaySummary();
  }, [loadTodaySummary]);

  // Refetch data when refresh is triggered
  useEffect(() => {
    if (refreshTrigger > 0) {
      loadTodaySummary();
    }
  }, [refreshTrigger, loadTodaySummary]);

  // Merge optimistic activities with fetched activities
  // Optimistic activities override fetched activities with the same ID
  const allActivities = useMemo(() => {
    const optimisticIds = new Set(optimisticActivities.map((a) => a.id));
    return [
      ...optimisticActivities,
      ...activitiesData.filter((a) => !optimisticIds.has(a.id)),
    ];
  }, [optimisticActivities, activitiesData]);

  // Map activity types to display categories
  const mapActivityTypeToCategory = (type: string): string => {
    if (type === 'bottle' || type === 'nursing') return 'feeding';
    return type;
  };

  // Group activities by category, tracking count and totals
  const activitySummaries = allActivities.reduce(
    (acc, activity) => {
      const category = mapActivityTypeToCategory(activity.type);
      if (!acc[category]) {
        acc[category] = {
          count: 1,
          totalAmount: activity.amount || 0,
          totalDuration: activity.duration || 0,
        };
      } else {
        acc[category].count += 1;
        acc[category].totalDuration += activity.duration || 0;
        acc[category].totalAmount += activity.amount || 0;
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

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-5 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-32 mb-4" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-2.5">
          <div className="h-16 bg-muted/30 rounded" />
          <div className="h-16 bg-muted/30 rounded" />
          <div className="h-16 bg-muted/30 rounded" />
          <div className="h-16 bg-muted/30 rounded" />
          <div className="h-16 bg-muted/30 rounded" />
          <div className="h-16 bg-muted/30 rounded" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-linear-to-br from-card/50 to-card/80 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2.5">
          <div className="relative flex items-center justify-center size-9 rounded-full bg-linear-to-br from-primary to-primary/80 p-[2px] shadow-md shadow-primary/20">
            <div className="size-full rounded-full bg-card flex items-center justify-center p-0.5">
              <NuggetAvatar
                image={babyPhotoUrl || undefined}
                name={babyName}
                size="sm"
              />
            </div>
          </div>
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
