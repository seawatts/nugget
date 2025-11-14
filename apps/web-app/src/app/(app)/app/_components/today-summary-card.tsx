'use client';

import type { Activities } from '@nugget/db/schema';
import { formatDistanceToNow } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
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
import { useCallback, useEffect, useMemo, useState } from 'react';
import { getTodaySummaryAction } from './today-summary.actions';

const activityIcons: Record<string, LucideIcon> = {
  activity: Activity,
  bath: Bath,
  bottle: Milk,
  diaper: Baby,
  growth: Scale,
  medicine: Pill,
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
  growth: 'text-[oklch(0.62_0.18_260)]',
  medicine: 'text-[oklch(0.68_0.18_10)]',
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
  growth: 'Growth',
  medicine: 'Medicine',
  nursing: 'Nursing',
  potty: 'Potty',
  pumping: 'Pumping',
  sleep: 'Sleep',
  solids: 'Solids',
  temperature: 'Temperature',
  'tummy-time': 'Tummy Time',
};

interface TodaySummaryCardProps {
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

function formatTimeAgo(activity: typeof Activities.$inferSelect): string {
  const timeAgo = formatDistanceToNow(new Date(activity.startTime), {
    addSuffix: false,
  });
  // Remove "about" prefix for cleaner display
  const cleanTimeAgo = timeAgo.replace(/^about\s+/, '');
  return `${cleanTimeAgo} ago`;
}

function formatLastAmount(activity: typeof Activities.$inferSelect): string {
  const type = activity.type;

  // Activities with duration (sleep, tummy_time, etc)
  if (
    (type === 'sleep' || type === 'tummy_time' || type === 'bath') &&
    activity.duration &&
    activity.duration > 0
  ) {
    return formatDuration(activity.duration);
  }

  // Feeding activities (bottle, nursing, pumping) - show amount
  if (
    (type === 'bottle' || type === 'nursing' || type === 'pumping') &&
    activity.amount &&
    activity.amount > 0
  ) {
    const amountOz = Math.round(activity.amount / 30); // Convert ml to oz
    return `${amountOz}oz`;
  }

  // For other activities, don't show anything
  return '';
}

export function TodaySummaryCard({
  optimisticActivities = [],
  refreshTrigger = 0,
}: TodaySummaryCardProps) {
  const [activitiesData, setActivitiesData] = useState<
    Array<typeof Activities.$inferSelect>
  >([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadTodaySummary = useCallback(async () => {
    try {
      setLoading(true);
      const result = await getTodaySummaryAction();

      if (result?.data) {
        setActivitiesData(result.data.activities);
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

  // Group activities by type, tracking count, most recent activity, and totals
  const activitySummaries = allActivities.reduce(
    (acc, activity) => {
      const type = activity.type;
      if (!acc[type]) {
        acc[type] = {
          count: 1,
          mostRecent: activity,
          totalAmount: activity.amount || 0,
          totalDuration: activity.duration || 0,
        };
      } else {
        acc[type].count += 1;
        acc[type].totalDuration += activity.duration || 0;
        acc[type].totalAmount += activity.amount || 0;
        // Update most recent if this activity is newer
        if (
          new Date(activity.startTime).getTime() >
          new Date(acc[type].mostRecent.startTime).getTime()
        ) {
          acc[type].mostRecent = activity;
        }
      }
      return acc;
    },
    {} as Record<
      string,
      {
        count: number;
        mostRecent: typeof Activities.$inferSelect;
        totalDuration: number;
        totalAmount: number;
      }
    >,
  );

  if (loading) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-4 animate-pulse">
        <div className="h-6 bg-muted/30 rounded w-32 mb-4" />
        <div className="grid grid-cols-2 gap-3">
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

  if (allActivities.length === 0) {
    return (
      <div className="rounded-xl border border-border bg-card/50 p-6">
        <div className="flex flex-col items-center justify-center text-center gap-2">
          <Baby className="size-8 text-muted-foreground/50" />
          <p className="text-sm text-muted-foreground">
            No activities tracked today yet
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-gradient-to-br from-card/50 to-card/80 backdrop-blur-sm p-5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-foreground">
          Today's Summary
        </h2>
        <span className="text-sm text-muted-foreground font-medium">
          {allActivities.length}{' '}
          {allActivities.length === 1 ? 'activity' : 'activities'}
        </span>
      </div>

      {/* Activity summaries grid */}
      <div className="grid grid-cols-2 gap-2.5">
        {Object.entries(activitySummaries)
          .sort((a, b) => b[1].count - a[1].count) // Sort by count descending
          .slice(0, 4) // Show top 4
          .map(([type, summary]) => {
            const Icon = activityIcons[type] || Baby;
            const colorClass = activityColors[type] || 'text-primary';
            const label = activityLabels[type] || type;
            const timeAgo = formatTimeAgo(summary.mostRecent);
            const lastAmount = formatLastAmount(summary.mostRecent);

            return (
              <div
                className="flex items-start gap-2.5 p-3 rounded-lg bg-card/60 border border-border/50"
                key={type}
              >
                <div className="shrink-0 p-2 rounded-full bg-muted/40 self-start">
                  <Icon className={`size-4 ${colorClass}`} />
                </div>
                <div className="flex-1 min-w-0 flex flex-col gap-0.5">
                  <p className="text-xs text-muted-foreground leading-tight">
                    {label}
                  </p>
                  <p className="text-sm font-semibold text-foreground leading-tight">
                    {timeAgo}
                  </p>
                  {lastAmount && (
                    <p className="text-xs text-muted-foreground/70 leading-tight">
                      {lastAmount}
                    </p>
                  )}
                </div>
              </div>
            );
          })}
      </div>
    </div>
  );
}
