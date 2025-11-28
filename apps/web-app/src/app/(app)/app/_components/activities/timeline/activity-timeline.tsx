'use client';

import { api, type TimelineItem } from '@nugget/api/react';
import type { Activities, Milestones } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { Icons } from '@nugget/ui/custom/icons';
import { differenceInMinutes, format, isToday, isYesterday } from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  Baby,
  Ban,
  Bath,
  Droplet,
  Droplets,
  Heart,
  MessageSquare,
  Milk,
  Moon,
  Pill,
  Scale,
  Scissors,
  Stethoscope,
  Thermometer,
  Timer,
  Tablet as Toilet,
  UtensilsCrossed,
} from 'lucide-react';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useDashboardDataStore } from '~/stores/dashboard-data';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { ChatDialog } from '../../chat/chat-dialog';
import { MilestoneViewDrawer } from '../../milestones/milestone-view-drawer';
import { TimelineBathDrawer } from '../bath/timeline-bath-drawer';
import { TimelineDiaperDrawer } from '../diaper/timeline-diaper-drawer';
import { TimelineDoctorVisitDrawer } from '../doctor-visit/timeline-doctor-visit-drawer';
import { TimelineFeedingDrawer } from '../feeding/timeline-feeding-drawer';
import { TimelineNailTrimmingDrawer } from '../nail-trimming/timeline-nail-trimming-drawer';
import { TimelinePumpingDrawer } from '../pumping/timeline-pumping-drawer';
import { getDisplayNotes } from '../shared/activity-utils';
import { TimelineDrawerWrapper } from '../shared/components/timeline-drawer-wrapper';
import {
  formatLengthDisplay,
  formatWeightDisplay,
} from '../shared/measurement-utils';
import { formatMinutesToHoursMinutes } from '../shared/time-formatting-utils';
import { formatCompactRelativeTime } from '../shared/utils/format-compact-relative-time';
import { formatVolumeDisplay, getVolumeUnit } from '../shared/volume-utils';
import { TimelineSleepDrawer } from '../sleep/timeline-sleep-drawer';
import { TimelineVitaminDDrawer } from '../vitamin-d/timeline-vitamin-d-drawer';
import { ActivityTimelineFilters } from './activity-timeline-filters';

const activities = [
  {
    color: 'bg-activity-sleep',
    icon: Moon,
    id: 'sleep',
    label: 'Sleep',
    textColor: 'text-activity-sleep-foreground',
  },
  {
    color: 'bg-activity-feeding',
    icon: Droplet,
    id: 'nursing',
    label: 'Nursing',
    textColor: 'text-activity-feeding-foreground',
  },
  {
    color: 'bg-activity-feeding',
    icon: Milk,
    id: 'bottle',
    label: 'Bottle',
    textColor: 'text-activity-feeding-foreground',
  },
  {
    color: 'bg-activity-solids',
    icon: UtensilsCrossed,
    id: 'solids',
    label: 'Solids',
    textColor: 'text-activity-solids-foreground',
  },
  {
    color: 'bg-activity-diaper',
    icon: Baby,
    id: 'diaper',
    label: 'Diaper',
    textColor: 'text-activity-diaper-foreground',
  },
  {
    color: 'bg-activity-pumping',
    icon: Droplets,
    id: 'pumping',
    label: 'Pumping',
    textColor: 'text-activity-pumping-foreground',
  },
  {
    color: 'bg-activity-potty',
    icon: Toilet,
    id: 'potty',
    label: 'Potty',
    textColor: 'text-activity-potty-foreground',
  },
  {
    color: 'bg-activity-tummy-time',
    icon: Activity,
    id: 'activity',
    label: 'Activity',
    textColor: 'text-activity-tummy-time-foreground',
  },
  {
    color: 'bg-activity-tummy-time',
    icon: Timer,
    id: 'tummy-time',
    label: 'Tummy Time',
    textColor: 'text-activity-tummy-time-foreground',
  },
  {
    color: 'bg-activity-medicine',
    icon: Pill,
    id: 'medicine',
    label: 'Medicine',
    textColor: 'text-activity-medicine-foreground',
  },
  {
    color: 'bg-activity-vitamin-d',
    icon: Pill,
    id: 'vitamin_d',
    label: 'Vitamin D',
    textColor: 'text-activity-vitamin-d-foreground',
  },
  {
    color: 'bg-activity-nail-trimming',
    icon: Scissors,
    id: 'nail_trimming',
    label: 'Nail Trimming',
    textColor: 'text-activity-nail-trimming-foreground',
  },
  {
    color: 'bg-activity-temperature',
    icon: Thermometer,
    id: 'temperature',
    label: 'Temperature',
    textColor: 'text-activity-temperature-foreground',
  },
  {
    color: 'bg-activity-growth',
    icon: Scale,
    id: 'growth',
    label: 'Growth',
    textColor: 'text-activity-growth-foreground',
  },
  {
    color: 'bg-activity-bath',
    icon: Bath,
    id: 'bath',
    label: 'Bath',
    textColor: 'text-activity-bath-foreground',
  },
  {
    color: 'bg-yellow-500',
    icon: Award,
    id: 'milestone',
    label: 'Milestones',
    textColor: 'text-white',
  },
  {
    color: 'bg-green-500',
    icon: MessageSquare,
    id: 'chat',
    label: 'Chats',
    textColor: 'text-white',
  },
  {
    color: 'bg-gray-500',
    icon: Ban,
    id: 'skipped',
    label: 'Skipped Activities',
    textColor: 'text-white',
  },
  {
    color: 'bg-activity-parent-wellness',
    icon: Heart,
    id: 'parent_wellness',
    label: 'Daily Check-In',
    textColor: 'text-activity-parent-wellness-foreground',
  },
] satisfies Array<{
  color: string;
  icon: LucideIcon;
  id: string;
  label: string;
  textColor: string;
}>;

function getTimelineActivityTimestamp(
  activity: typeof Activities.$inferSelect,
) {
  return activity.type === 'sleep' && activity.endTime
    ? new Date(activity.endTime)
    : new Date(activity.startTime);
}

const activityIcons: Record<string, typeof Moon> = {
  activity: Activity,
  bath: Bath,
  bottle: Milk,
  chat: MessageSquare,
  diaper: Baby,
  doctor_visit: Stethoscope,
  growth: Scale,
  medicine: Pill,
  milestone: Award,
  nail_trimming: Scissors,
  nursing: Droplet,
  parent_wellness: Heart,
  potty: Toilet,
  pumping: Droplets,
  sleep: Moon,
  solids: UtensilsCrossed,
  temperature: Thermometer,
  'tummy-time': Timer,
  vitamin_d: Pill,
};

const activityColors: Record<string, string> = {
  activity: 'border-l-activity-tummy-time',
  bath: 'border-l-activity-bath',
  bottle: 'border-l-activity-feeding',
  chat: 'border-l-activity-chat',
  diaper: 'border-l-activity-diaper',
  doctor_visit: 'border-l-activity-doctor-visit',
  growth: 'border-l-activity-growth',
  medicine: 'border-l-activity-medicine',
  milestone: 'border-l-activity-milestone',
  nail_trimming: 'border-l-activity-nail-trimming',
  nursing: 'border-l-activity-feeding',
  parent_wellness: 'border-l-activity-parent-wellness',
  potty: 'border-l-activity-potty',
  pumping: 'border-l-activity-pumping',
  sleep: 'border-l-activity-sleep',
  solids: 'border-l-activity-solids',
  temperature: 'border-l-activity-temperature',
  'tummy-time': 'border-l-activity-tummy-time',
  vitamin_d: 'border-l-activity-vitamin-d',
};

const activityIconColors: Record<string, string> = {
  activity: 'text-activity-tummy-time',
  bath: 'text-activity-bath',
  bottle: 'text-activity-feeding',
  chat: 'text-activity-chat',
  diaper: 'text-activity-diaper',
  growth: 'text-activity-growth',
  medicine: 'text-activity-medicine',
  milestone: 'text-activity-milestone',
  nail_trimming: 'text-activity-nail-trimming',
  nursing: 'text-activity-feeding',
  parent_wellness: 'text-activity-parent-wellness',
  potty: 'text-activity-potty',
  pumping: 'text-activity-pumping',
  sleep: 'text-activity-sleep',
  solids: 'text-activity-solids',
  temperature: 'text-activity-temperature',
  'tummy-time': 'text-activity-tummy-time',
  vitamin_d: 'text-activity-vitamin-d',
};

// Activity type to label mapping for proper display names
const activityLabels: Record<string, string> = {
  activity: 'Activity',
  bath: 'Bath',
  bottle: 'Bottle',
  chat: 'Chat',
  diaper: 'Diaper',
  doctor_visit: 'Doctor Visit',
  growth: 'Growth',
  medicine: 'Medicine',
  milestone: 'Milestone',
  nail_trimming: 'Nail Trimming',
  nursing: 'Nursing',
  parent_wellness: 'Daily Check-In',
  potty: 'Potty',
  pumping: 'Pumping',
  sleep: 'Sleep',
  solids: 'Solids',
  temperature: 'Temperature',
  tummy_time: 'Tummy Time',
  'tummy-time': 'Tummy Time',
  vitamin_d: 'Vitamin D',
};

function groupTimelineItemsByDay(
  items: TimelineItem[],
): Map<string, TimelineItem[]> {
  const grouped = new Map<string, TimelineItem[]>();

  for (const item of items) {
    const itemDate = item.timestamp;

    // Skip items with invalid dates
    if (
      !itemDate ||
      !(itemDate instanceof Date) ||
      Number.isNaN(itemDate.getTime())
    ) {
      continue;
    }

    // The date-fns isToday/isYesterday functions handle timezone correctly
    // They compare the local date parts, not the UTC timestamps
    let dayLabel: string;

    if (isToday(itemDate)) {
      dayLabel = 'Today';
    } else if (isYesterday(itemDate)) {
      dayLabel = 'Yesterday';
    } else {
      dayLabel = format(itemDate, 'EEEE, MMMM d');
    }

    if (!grouped.has(dayLabel)) {
      grouped.set(dayLabel, []);
    }
    grouped.get(dayLabel)?.push(item);
  }

  return grouped;
}

function formatTimeGap(minutes: number): string {
  if (minutes < 60) {
    return `${minutes} min${minutes !== 1 ? 's' : ''}`;
  }
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  if (remainingMinutes === 0) {
    return `${hours} hour${hours !== 1 ? 's' : ''}`;
  }
  return `${hours}h ${remainingMinutes}m`;
}

interface ActivityTimelineProps {
  babyId: string;
}

export function ActivityTimeline({ babyId }: ActivityTimelineProps) {
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [selectedMilestone, setSelectedMilestone] = useState<
    typeof Milestones.$inferSelect | null
  >(null);
  const [milestoneDrawerOpen, setMilestoneDrawerOpen] = useState(false);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(
    [],
  );
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatData, setSelectedChatData] = useState<{
    chatId: string;
    babyId: string;
  } | null>(null);

  // Get optimistic activities from Zustand store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();
  const optimisticActivityUpdates =
    useOptimisticActivitiesStore.use.updatedActivities();

  // Get user preferences from dashboard store (already fetched by DashboardContainer)
  const user = useDashboardDataStore.use.user();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');
  const timeFormat = user?.timeFormat || '12h';
  const measurementUnit = user?.measurementUnit || 'metric';

  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Track active day header (the one currently stuck at top)
  const [activeDayIndex, setActiveDayIndex] = useState<number | null>(0);
  const dayHeaderRefs = useRef<Map<number, HTMLDivElement>>(new Map());

  // Build filters for timeline query
  const timelineFilters = useMemo(() => {
    if (!babyId) return null;

    // Determine which item types to fetch based on selected filters
    const itemTypes: Array<'activity' | 'milestone' | 'chat'> = [];

    if (selectedActivityTypes.length === 0) {
      // No filters selected - fetch all types
      itemTypes.push('activity', 'milestone', 'chat');
    } else {
      // Check if any actual activity types are selected (excluding milestone, chat, and skipped)
      const activityTypesList = selectedActivityTypes.filter(
        (type) => type !== 'milestone' && type !== 'chat' && type !== 'skipped',
      );

      if (activityTypesList.length > 0) {
        itemTypes.push('activity');
      }

      if (selectedActivityTypes.includes('milestone')) {
        itemTypes.push('milestone');
      }

      if (selectedActivityTypes.includes('chat')) {
        itemTypes.push('chat');
      }
    }

    const activityTypesList = selectedActivityTypes.filter(
      (type) => type !== 'milestone' && type !== 'chat' && type !== 'skipped',
    );

    return {
      activityTypes:
        activityTypesList.length > 0 ? activityTypesList : undefined,
      babyId,
      itemTypes: itemTypes.length > 0 ? itemTypes : undefined,
      limit: 30,
      userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
    };
  }, [babyId, selectedActivityTypes, selectedUserIds]);

  // Use tRPC infinite query for timeline data
  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
    api.timeline.getItems.useInfiniteQuery(
      timelineFilters ?? {
        babyId: '',
        limit: 30,
      },
      {
        enabled: !!timelineFilters,
        getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
        staleTime: 10000, // Consider data fresh for 10 seconds
      },
    );

  // Flatten all pages into a single list and deduplicate
  const serverTimelineItems = useMemo(() => {
    if (!data?.pages) return [];

    const flattened = data.pages.flatMap((page) =>
      page.items.filter((item) => {
        // Filter out items with invalid timestamps
        const isValid =
          item.timestamp instanceof Date &&
          !Number.isNaN(item.timestamp.getTime());
        return isValid;
      }),
    ) as TimelineItem[];

    // Deduplicate items by creating a unique key for each item
    const seen = new Set<string>();
    const deduplicated: TimelineItem[] = [];

    for (const item of flattened) {
      // Create a unique key for this item
      let uniqueKey: string;
      if (item.type === 'activity') {
        uniqueKey = `activity-${item.data.id}`;
      } else if (item.type === 'milestone') {
        uniqueKey = `milestone-${item.data.id}`;
      } else if (item.type === 'chat') {
        uniqueKey = `chat-${item.data.chat.id}`;
      } else {
        const fallbackItem = item as TimelineItem;
        // Fallback for unknown types while keeping gate for future union members
        uniqueKey = `${fallbackItem.type}-${fallbackItem.timestamp.getTime()}`;
      }

      if (!seen.has(uniqueKey)) {
        seen.add(uniqueKey);
        deduplicated.push(item);
      }
    }

    return deduplicated;
  }, [data?.pages]);

  const serverTimelineItemsWithOptimisticUpdates = useMemo(() => {
    if (!babyId) return serverTimelineItems;

    return serverTimelineItems.map((item) => {
      if (item.type !== 'activity') return item;

      const optimisticUpdate = optimisticActivityUpdates[item.data.id];
      if (!optimisticUpdate || optimisticUpdate.babyId !== babyId) {
        return item;
      }

      return {
        ...item,
        data: optimisticUpdate,
        timestamp: getTimelineActivityTimestamp(optimisticUpdate),
      };
    });
  }, [serverTimelineItems, optimisticActivityUpdates, babyId]);

  // Merge optimistic activities with timeline items
  const optimisticTimelineItems = useMemo(() => {
    return optimisticActivities
      .filter((activity) => {
        // Filter by babyId to ensure only activities for this baby are shown
        // This is a defensive measure to prevent cross-baby activity display
        return activity.babyId === babyId;
      })
      .map((activity): TimelineItem => {
        return {
          data: activity,
          timestamp: getTimelineActivityTimestamp(activity),
          type: 'activity' as const,
        };
      })
      .filter((item) => {
        // Filter out items with invalid timestamps
        const isValid =
          item.timestamp instanceof Date &&
          !Number.isNaN(item.timestamp.getTime());
        return isValid;
      });
  }, [optimisticActivities, babyId]);

  // Merge all timeline items and sort by timestamp
  const allTimelineItems = useMemo(() => {
    // Deduplicate optimistic activities - remove optimistic items if a matching real activity exists
    const deduplicatedOptimisticItems = optimisticTimelineItems.filter(
      (optimisticItem) => {
        if (optimisticItem.type !== 'activity') return true;

        // Check if there's a matching real activity (same type, similar timestamp)
        const hasMatchingRealActivity =
          serverTimelineItemsWithOptimisticUpdates.some((realItem) => {
            if (realItem.type !== 'activity') return false;

            const realActivity = realItem.data;
            const optimisticActivity = optimisticItem.data;

            // Match by type and timestamp (within 1 second tolerance)
            if (realActivity.type !== optimisticActivity.type) return false;

            const timeDiff = Math.abs(
              realItem.timestamp.getTime() - optimisticItem.timestamp.getTime(),
            );

            return timeDiff <= 1000; // 1 second tolerance
          });

        // Keep optimistic item only if no matching real activity exists
        return !hasMatchingRealActivity;
      },
    );

    const merged = [
      ...deduplicatedOptimisticItems,
      ...serverTimelineItemsWithOptimisticUpdates,
    ];

    // Check if skipped activities should be shown
    const showSkipped =
      selectedActivityTypes.length === 0 ||
      selectedActivityTypes.includes('skipped');

    // Apply client-side filters
    const filtered = merged.filter((item) => {
      // Filter out skipped activities if 'skipped' is not selected
      if (!showSkipped && item.type === 'activity') {
        const activity = item.data;
        if (
          activity.details &&
          'skipped' in activity.details &&
          activity.details.skipped
        ) {
          return false;
        }
      }

      return true;
    });

    const sorted = filtered.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );

    return sorted;
  }, [
    optimisticTimelineItems,
    serverTimelineItemsWithOptimisticUpdates,
    selectedActivityTypes,
  ]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target?.isIntersecting && hasNextPage && !isFetchingNextPage) {
          void fetchNextPage();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before reaching the element
        threshold: 0.1,
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef && hasNextPage) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [hasNextPage, isFetchingNextPage, fetchNextPage]);

  const handleItemClick = (item: TimelineItem) => {
    if (item.type === 'activity') {
      setEditingActivity(item.data);
      setOpenDrawer(item.data.type);
    } else if (item.type === 'chat') {
      // Open chat dialog with the chat data
      setSelectedChatData({
        babyId: item.data.chat.babyId,
        chatId: item.data.chat.id,
      });
      setChatDialogOpen(true);
    } else if (item.type === 'milestone') {
      // Open milestone drawer
      setSelectedMilestone(item.data);
      setMilestoneDrawerOpen(true);
    } else if (item.type === 'parent_wellness') {
      // Parent wellness items are display-only, no action needed
      return;
    }
  };

  const handleDrawerClose = () => {
    setOpenDrawer(null);
    setEditingActivity(null);
  };

  const handleMilestoneDrawerClose = () => {
    setMilestoneDrawerOpen(false);
    setSelectedMilestone(null);
  };

  const handleFilterChange = (userIds: string[], activityTypes: string[]) => {
    setSelectedUserIds(userIds);
    setSelectedActivityTypes(activityTypes);
    // React Query will automatically refetch with new filters
  };

  const groupedItems = groupTimelineItemsByDay(allTimelineItems);
  const groupedItemsArray = Array.from(groupedItems.entries());

  // Setup intersection observer for day headers to track which one is active
  useEffect(() => {
    const headers = Array.from(dayHeaderRefs.current.values());
    if (headers.length === 0) {
      // Set initial active day to first one if headers aren't ready yet
      if (groupedItemsArray.length > 0 && activeDayIndex === null) {
        setActiveDayIndex(0);
      }
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        // Find the header that is currently stuck at the top
        // A sticky header that's "stuck" will have boundingClientRect.top close to 0
        const stuckHeaders: Array<{
          entry: IntersectionObserverEntry;
          index: number;
        }> = [];

        entries.forEach((entry) => {
          const top = entry.boundingClientRect.top;
          // A header is considered "stuck" if it's at the top (within 5px of 0)
          // and is intersecting
          if (entry.isIntersecting && top >= -5 && top <= 5) {
            // Find the index of this header
            for (const [index, element] of dayHeaderRefs.current.entries()) {
              if (element === entry.target) {
                stuckHeaders.push({ entry, index });
                break;
              }
            }
          }
        });

        if (stuckHeaders.length > 0) {
          // If multiple headers are stuck (shouldn't happen, but handle it),
          // prefer the one with the smallest top value (closest to 0)
          const activeHeader = stuckHeaders.reduce((prev, curr) => {
            const prevTop = Math.abs(prev.entry.boundingClientRect.top);
            const currTop = Math.abs(curr.entry.boundingClientRect.top);
            return currTop < prevTop ? curr : prev;
          });
          setActiveDayIndex(activeHeader.index);
        } else {
          // If no header is stuck, find the one closest to the top
          type HeaderEntry = {
            entry: IntersectionObserverEntry;
            index: number;
          };
          let closestEntry: HeaderEntry | null = null;
          let closestDistance = Number.POSITIVE_INFINITY;

          for (const entry of entries) {
            if (entry.isIntersecting) {
              const top = entry.boundingClientRect.top;
              // Only consider headers that are above or at the viewport top
              if (top <= 10) {
                const distance = Math.abs(top);
                if (distance < closestDistance) {
                  for (const [
                    index,
                    element,
                  ] of dayHeaderRefs.current.entries()) {
                    if (element === entry.target) {
                      closestEntry = { entry, index };
                      closestDistance = distance;
                      break;
                    }
                  }
                }
              }
            }
          }

          if (closestEntry) {
            setActiveDayIndex(closestEntry.index);
          }
        }
      },
      {
        root: null, // Use viewport as root
        rootMargin: '0px', // No margin adjustment
        threshold: [0, 0.1, 0.5, 1], // Multiple thresholds for better detection
      },
    );

    // Observe all day headers
    headers.forEach((header) => {
      if (header) {
        observer.observe(header);
      }
    });

    // Set initial active day to first one if not set
    if (headers.length > 0 && activeDayIndex === null) {
      setActiveDayIndex(0);
    }

    return () => {
      headers.forEach((header) => {
        if (header) {
          observer.unobserve(header);
        }
      });
    };
  }, [groupedItemsArray.length, activeDayIndex]);

  // Show loading state on initial load
  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Icons.Spinner className="size-8 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  if (allTimelineItems.length === 0 && !isLoading && data?.pages) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <div className="rounded-full bg-muted/30 p-4 mb-4">
          <Baby className="size-8 text-muted-foreground" />
        </div>
        <h3 className="font-semibold text-lg mb-1">No timeline items yet</h3>
        <p className="text-sm text-muted-foreground text-center">
          Start tracking by tapping a quick action button above
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-6">
      {groupedItemsArray.map(([dayLabel, dayItems], groupIndex) => {
        // Create a stable key for each day section
        const dayKey = `${dayLabel}-${dayItems[0]?.timestamp.getTime() || groupIndex}`;
        const isActive = activeDayIndex === groupIndex;
        return (
          <div key={dayKey}>
            <div
              className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10 border-b border-border/50 flex items-center justify-between"
              ref={(el) => {
                if (el) {
                  dayHeaderRefs.current.set(groupIndex, el);
                } else {
                  dayHeaderRefs.current.delete(groupIndex);
                }
              }}
            >
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                {dayLabel}
              </h3>
              {isActive && (
                <ActivityTimelineFilters
                  activityTypes={activities}
                  onFilterChange={handleFilterChange}
                  selectedActivityTypes={selectedActivityTypes}
                  selectedUserIds={selectedUserIds}
                />
              )}
            </div>
            <div className="flex flex-col gap-2.5">
              {dayItems.map((item, index) => {
                // Determine item type and extract data
                // For activities, use the activity type (nursing, sleep, etc.)
                // For milestones and chats, use the item type
                const iconKey =
                  item.type === 'activity' ? item.data.type : item.type;
                const Icon = activityIcons[iconKey] || Baby;
                const colorClass =
                  activityColors[iconKey] || 'border-l-primary';
                const iconColorClass =
                  activityIconColors[iconKey] || 'text-primary';
                const itemDate = item.timestamp;
                const absoluteTime = formatTimeWithPreference(
                  itemDate,
                  timeFormat,
                );
                const relativeTime = formatCompactRelativeTime(itemDate, {
                  addSuffix: true,
                });
                const isOptimistic =
                  item.type === 'activity' &&
                  item.data.id.startsWith('activity-optimistic');

                // Build item details string based on type
                const details: string[] = [];
                let itemTitle = '';
                let itemNotes = '';
                let itemId = '';
                let isSkipped = false;
                let userName = '';
                let userAvatar: string | null = null;
                let userInitials = '';

                if (item.type === 'activity') {
                  const activity = item.data;
                  itemTitle =
                    activityLabels[activity.type] ||
                    activity.type.replace('_', ' ').replace('-', ' ');
                  itemNotes = activity.notes || '';
                  itemId = activity.id;

                  // Extract user information
                  if (activity.user) {
                    const firstName = activity.user.firstName || '';
                    const lastName = activity.user.lastName || '';
                    userName = firstName
                      ? `${firstName}${lastName ? ` ${lastName}` : ''}`
                      : activity.user.email;
                    userAvatar = activity.user.avatarUrl;
                    userInitials = firstName
                      ? `${firstName[0]}${lastName?.[0] || ''}`
                      : activity.user.email[0]?.toUpperCase() || '?';
                  }

                  // Check if activity is skipped
                  isSkipped = Boolean(
                    activity.details &&
                      'skipped' in activity.details &&
                      activity.details.skipped === true,
                  );

                  if (activity.duration) {
                    // Format sleep duration as hours and minutes, others as minutes
                    if (activity.type === 'sleep') {
                      details.push(
                        formatMinutesToHoursMinutes(activity.duration),
                      );
                    } else {
                      let durationText = `${activity.duration} min`;
                      // Add (L) or (R) indicator for nursing activities
                      if (
                        activity.type === 'nursing' &&
                        activity.details &&
                        'side' in activity.details
                      ) {
                        const side = (
                          activity.details as {
                            side?: 'left' | 'right' | 'both';
                          }
                        ).side;
                        if (side && side !== 'both') {
                          durationText += ` (${side === 'left' ? 'L' : 'R'})`;
                        }
                      }
                      details.push(durationText);
                    }
                  }
                  if (activity.amountMl) {
                    details.push(
                      formatVolumeDisplay(
                        activity.amountMl,
                        userUnitPref,
                        true,
                      ),
                    );
                  }

                  // Add diaper type details
                  if (activity.type === 'diaper' && activity.details) {
                    const diaperDetails = activity.details as {
                      type?: string;
                      wet?: boolean;
                      dirty?: boolean;
                      hasRash?: boolean;
                      isGassy?: boolean;
                    };
                    if (diaperDetails.type === 'wet') {
                      details.push('Pee');
                    } else if (diaperDetails.type === 'dirty') {
                      details.push('Poop');
                    } else if (diaperDetails.type === 'both') {
                      details.push('Both');
                    } else if (diaperDetails.wet && diaperDetails.dirty) {
                      details.push('Both');
                    } else if (diaperDetails.wet) {
                      details.push('Pee');
                    } else if (diaperDetails.dirty) {
                      details.push('Poop');
                    }

                    // Add gassy indicator
                    if (diaperDetails.isGassy) {
                      details.push('Gassy');
                    }

                    // Add rash indicator
                    if (diaperDetails.hasRash) {
                      details.push('Rash');
                    }
                  }

                  // Add doctor visit details
                  if (activity.type === 'doctor_visit' && activity.details) {
                    const visitDetails = activity.details as {
                      visitType?: string;
                      doctorName?: string;
                      weightKg?: string;
                      lengthCm?: string;
                      vaccinations?: string[];
                    };
                    if (visitDetails.visitType) {
                      const typeMap: Record<string, string> = {
                        'follow-up': 'Follow-up',
                        other: 'Visit',
                        sick: 'Sick visit',
                        'well-baby': 'Well-baby checkup',
                      };
                      details.push(
                        typeMap[visitDetails.visitType] ||
                          visitDetails.visitType,
                      );
                    }
                    if (visitDetails.doctorName) {
                      details.push(`Dr. ${visitDetails.doctorName}`);
                    }
                    if (visitDetails.weightKg) {
                      const weightNum = Number.parseFloat(
                        visitDetails.weightKg,
                      );
                      if (!Number.isNaN(weightNum)) {
                        details.push(
                          formatWeightDisplay(weightNum, measurementUnit),
                        );
                      }
                    }
                    if (visitDetails.lengthCm) {
                      const lengthNum = Number.parseFloat(
                        visitDetails.lengthCm,
                      );
                      if (!Number.isNaN(lengthNum)) {
                        details.push(
                          formatLengthDisplay(lengthNum, measurementUnit),
                        );
                      }
                    }
                    if (
                      visitDetails.vaccinations &&
                      visitDetails.vaccinations.length > 0
                    ) {
                      details.push(
                        `${visitDetails.vaccinations.length} vaccine${visitDetails.vaccinations.length > 1 ? 's' : ''}`,
                      );
                    }
                  }
                } else if (item.type === 'milestone') {
                  const milestone = item.data;
                  itemTitle = milestone.title;
                  itemNotes = milestone.description || '';
                  itemId = milestone.id;
                } else if (item.type === 'chat') {
                  const chat = item.data;
                  itemTitle = 'Chat';
                  itemNotes =
                    chat.content.length > 100
                      ? `${chat.content.slice(0, 100)}...`
                      : chat.content;
                  itemId = chat.chat.id;
                } else if (item.type === 'parent_wellness') {
                  const wellness = item.data;
                  itemTitle = 'Daily Check-In';
                  itemNotes = `Q: ${wellness.question}\nA: ${wellness.selectedAnswer}`;
                  itemId = wellness.id;
                  if (wellness.user) {
                    const firstName = wellness.user.firstName || '';
                    const lastName = wellness.user.lastName || '';
                    userName = firstName
                      ? `${firstName}${lastName ? ` ${lastName}` : ''}`
                      : wellness.user.email;
                    userAvatar = wellness.user.avatarUrl;
                    userInitials =
                      `${firstName[0] || ''}${lastName[0] || ''}`.toUpperCase();
                  }
                }

                const detailsText =
                  details.length > 0 ? ` / ${details.join(', ')}` : '';

                // Calculate time gap from previous item
                const previousItem = index > 0 ? dayItems[index - 1] : null;
                const timeGapMinutes = previousItem
                  ? differenceInMinutes(previousItem.timestamp, itemDate)
                  : 0;
                const showTimeGap = timeGapMinutes >= 15;

                // Generate a globally unique key based on item identity
                // Use itemId + type + timestamp to ensure uniqueness
                // The deduplication above should prevent duplicates, but this ensures
                // keys are unique even if deduplication misses something
                const timelineItemKey =
                  itemId && itemId.length > 0
                    ? `${item.type}-${itemId}-${item.timestamp.getTime()}`
                    : `${item.type}-${item.timestamp.getTime()}-${groupIndex}-${index}`;

                return (
                  <div key={timelineItemKey}>
                    {showTimeGap && (
                      <div className="flex items-center gap-3 py-2">
                        <div className="h-px bg-border/50 flex-1" />
                        <span className="text-xs text-muted-foreground/60 font-medium">
                          {formatTimeGap(timeGapMinutes)}
                        </span>
                        <div className="h-px bg-border/50 flex-1" />
                      </div>
                    )}
                    <button
                      className={`flex items-start gap-3 p-3.5 rounded-xl bg-card/50 border-l-4 ${colorClass} ${
                        isOptimistic
                          ? 'opacity-100 animate-pulse cursor-not-allowed'
                          : item.type === 'parent_wellness'
                            ? 'opacity-60 cursor-default'
                            : 'opacity-60 hover:opacity-90 cursor-pointer'
                      } transition-all duration-200 ${item.type !== 'parent_wellness' ? 'hover:scale-[1.01] hover:shadow-sm' : ''} w-full text-left`}
                      disabled={isOptimistic || item.type === 'parent_wellness'}
                      onClick={() =>
                        !isOptimistic &&
                        item.type !== 'parent_wellness' &&
                        handleItemClick(item)
                      }
                      type="button"
                    >
                      <div
                        className={`shrink-0 p-2 rounded-lg ${isOptimistic ? 'bg-primary/20' : 'bg-muted/40'}`}
                      >
                        {isOptimistic ? (
                          <Icons.Spinner className="size-4 text-primary" />
                        ) : (
                          <Icon className={`size-4 ${iconColorClass}`} />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0 flex items-center gap-2">
                            <h4
                              className={`text-sm font-medium ${item.type === 'activity' ? 'capitalize' : ''} ${isOptimistic ? 'text-foreground' : ''}`}
                            >
                              {itemTitle}
                              {detailsText && (
                                <span className="text-muted-foreground font-normal">
                                  {detailsText}
                                </span>
                              )}
                            </h4>
                            {isSkipped && (
                              <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium bg-muted text-muted-foreground shrink-0">
                                Skipped
                              </span>
                            )}
                          </div>
                          <div className="flex items-start gap-2 shrink-0">
                            <div className="flex flex-col items-end gap-0.5">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {absoluteTime}
                              </span>
                              <span className="text-xs text-muted-foreground/70 font-mono whitespace-nowrap">
                                {isOptimistic ? 'Just now' : relativeTime}
                              </span>
                            </div>
                            {(item.type === 'activity' ||
                              item.type === 'parent_wellness') &&
                              userName && (
                                <Avatar className="size-6 -mt-1">
                                  <AvatarImage
                                    alt={userName}
                                    src={userAvatar || ''}
                                  />
                                  <AvatarFallback className="text-[10px]">
                                    {userInitials}
                                  </AvatarFallback>
                                </Avatar>
                              )}
                          </div>
                        </div>
                        {getDisplayNotes(itemNotes) && (
                          <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                            {getDisplayNotes(itemNotes)}
                          </p>
                        )}
                        {isOptimistic && (
                          <p className="text-xs text-primary mt-1">Saving...</p>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}

      {/* Infinite scroll trigger */}
      <div className="py-4" ref={loadMoreRef}>
        {isFetchingNextPage && (
          <div className="flex items-center justify-center py-4">
            <Icons.Spinner className="size-6 text-muted-foreground" />
            <span className="ml-2 text-sm text-muted-foreground">
              Loading more...
            </span>
          </div>
        )}
        {!hasNextPage &&
          !isFetchingNextPage &&
          data?.pages &&
          data.pages.length > 0 && (
            <div className="text-center py-4">
              <p className="text-sm text-muted-foreground">
                No more items to load
              </p>
            </div>
          )}
      </div>

      {/* Timeline Activity Drawers - For editing activities from timeline */}
      {/* Feeding Drawer */}
      {editingActivity &&
        (openDrawer === 'feeding' ||
          openDrawer === 'nursing' ||
          openDrawer === 'bottle' ||
          openDrawer === 'solids') && (
          <TimelineDrawerWrapper
            isOpen={true}
            onClose={handleDrawerClose}
            title="Edit Feeding"
          >
            <TimelineFeedingDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={true}
              onClose={handleDrawerClose}
            />
          </TimelineDrawerWrapper>
        )}

      {/* Sleep Drawer */}
      {editingActivity && openDrawer === 'sleep' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Edit Sleep"
        >
          <TimelineSleepDrawer
            babyId={babyId}
            existingActivity={editingActivity}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Diaper Drawer */}
      {editingActivity &&
        (openDrawer === 'diaper' ||
          openDrawer === 'wet' ||
          openDrawer === 'dirty' ||
          openDrawer === 'both') && (
          <TimelineDrawerWrapper
            isOpen={true}
            onClose={handleDrawerClose}
            title="Edit Diaper"
          >
            <TimelineDiaperDrawer
              babyId={babyId}
              existingActivity={editingActivity}
              isOpen={true}
              onClose={handleDrawerClose}
            />
          </TimelineDrawerWrapper>
        )}

      {/* Pumping Drawer */}
      {editingActivity && openDrawer === 'pumping' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Edit Pumping"
        >
          <TimelinePumpingDrawer
            babyId={babyId}
            existingActivity={editingActivity}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Doctor Visit Drawer */}
      {editingActivity && openDrawer === 'doctor_visit' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Edit Doctor Visit"
        >
          <TimelineDoctorVisitDrawer
            babyId={babyId}
            existingActivity={editingActivity}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Vitamin D Drawer */}
      {editingActivity && openDrawer === 'vitamin_d' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Edit Vitamin D"
        >
          <TimelineVitaminDDrawer
            babyId={babyId}
            existingActivity={editingActivity}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Nail Trimming Drawer */}
      {editingActivity && openDrawer === 'nail_trimming' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Edit Nail Trimming"
        >
          <TimelineNailTrimmingDrawer
            babyId={babyId}
            existingActivity={editingActivity}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Bath Drawer */}
      {editingActivity && openDrawer === 'bath' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Edit Bath"
        >
          <TimelineBathDrawer
            babyId={babyId}
            existingActivity={editingActivity}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Chat Dialog */}
      {selectedChatData && (
        <ChatDialog
          babyId={selectedChatData.babyId}
          chatId={selectedChatData.chatId}
          onOpenChange={setChatDialogOpen}
          open={chatDialogOpen}
        />
      )}

      {/* Milestone Drawer */}
      <MilestoneViewDrawer
        isOpen={milestoneDrawerOpen}
        milestone={selectedMilestone}
        onClose={handleMilestoneDrawerClose}
      />
    </div>
  );
}
