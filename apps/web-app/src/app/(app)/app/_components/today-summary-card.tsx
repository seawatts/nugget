'use client';

import { api } from '@nugget/api/react';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@nugget/ui/accordion';
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

  // Fetch today's activities using optimized query (non-blocking)
  const { data: todayActivitiesData = [] } =
    api.activities.getTodaySummary.useQuery(
      { babyId: babyId ?? '' },
      { enabled: Boolean(babyId) },
    );

  const { data: celebrationData } =
    api.celebrations.getCarouselContent.useQuery(
      { babyId: babyId ?? '' },
      { enabled: Boolean(babyId), staleTime: 86400000 },
    );

  // Fetch milestones achieved today using tRPC query (non-blocking)
  const { data: allMilestones = [] } = api.milestones.list.useQuery(
    { babyId: babyId ?? '', limit: 100 },
    { enabled: Boolean(babyId) },
  );

  // Filter to only today's milestones
  const todayStart = useMemo(() => startOfDay(new Date()), []);

  const todayActivities = useMemo(() => {
    return todayActivitiesData;
  }, [todayActivitiesData]);

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

  const upcomingCelebration = useMemo(() => {
    if (!celebrationData || celebrationData.celebration) return null;
    const next = celebrationData.nextCelebration;
    if (!next?.shouldShow) return null;
    const daysUntil = Math.max(0, next.day - (celebrationData.ageInDays ?? 0));
    const cleanedTitle = next.title
      ?.replace(/[🎉🎂]/gu, '')
      .replace(/happy\s+/gi, '')
      .trim();
    return {
      babyLabel: celebrationData.babyName ?? babyName ?? 'Baby',
      daysUntil,
      title: cleanedTitle || 'special day',
    };
  }, [babyName, celebrationData]);

  return (
    <div className="rounded-2xl border border-border/40 bg-linear-to-br from-activity-vitamin-d via-activity-nail-trimming/95 to-activity-feeding backdrop-blur-xl p-6 shadow-xl shadow-activity-nail-trimming/20">
      <Accordion className="w-full" collapsible defaultValue="" type="single">
        <AccordionItem className="border-0" value="activity-cards">
          <AccordionTrigger className="hover:no-underline py-0 mb-0 data-[state=open]:mb-4 cursor-pointer items-center [&>svg]:translate-y-0">
            <div className="flex items-center justify-between w-full pr-4">
              <div className="flex items-center gap-2.5">
                <Link
                  className="relative flex items-center justify-center size-9 rounded-full bg-linear-to-br from-primary to-primary/80 p-[2px] shadow-md shadow-primary/20 transition-transform hover:scale-105 active:scale-95 cursor-pointer"
                  href="/app/settings/baby"
                  onClick={(e) => {
                    e.stopPropagation();
                  }}
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
                    <span className="text-xs text-foreground/80 font-mono leading-tight">
                      <LiveBabyAge birthDate={babyBirthDate} />
                    </span>
                  )}
                </div>
              </div>
              <span className="text-sm text-foreground/80 font-medium">
                {allActivities.length}{' '}
                {allActivities.length === 1 ? 'activity' : 'activities'}
              </span>
            </div>
          </AccordionTrigger>
          {upcomingCelebration && (
            <div className="mt-4 mb-2 data-[state=open]:mt-6 data-[state=open]:mb-4 flex items-start gap-3 rounded-xl border border-white/20 bg-white/10 px-5 py-4 text-sm text-foreground/90">
              <div className="shrink-0 rounded-full bg-white/20 p-2 text-activity-feeding">
                <Award className="size-4" />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">
                  {upcomingCelebration.daysUntil === 0
                    ? `Today is ${upcomingCelebration.babyLabel}'s ${upcomingCelebration.title}!`
                    : upcomingCelebration.daysUntil === 1
                      ? `1 day to ${upcomingCelebration.babyLabel}'s ${upcomingCelebration.title}!`
                      : `${upcomingCelebration.daysUntil} days to ${upcomingCelebration.babyLabel}'s ${upcomingCelebration.title}!`}
                </p>
                <p className="text-xs text-foreground/80 leading-snug">
                  Come back then to see the celebration.
                </p>
              </div>
            </div>
          )}
          <AccordionContent className="pt-0">
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
          </AccordionContent>
        </AccordionItem>
      </Accordion>
    </div>
  );
}
