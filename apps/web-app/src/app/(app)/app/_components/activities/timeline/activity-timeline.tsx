'use client';

import { api } from '@nugget/api/react';
import type { Activities, Milestones } from '@nugget/db/schema';
import { Icons } from '@nugget/ui/custom/icons';
import { Dialog, DialogContent, DialogTitle } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useIsDesktop } from '@nugget/ui/hooks/use-media-query';
import {
  differenceInMinutes,
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
  startOfDay,
} from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  Baby,
  Ban,
  Bath,
  Droplet,
  Droplets,
  MessageSquare,
  Milk,
  Moon,
  Pill,
  Scale,
  Stethoscope,
  Thermometer,
  Timer,
  Tablet as Toilet,
  UtensilsCrossed,
} from 'lucide-react';
import { useAction } from 'next-safe-action/hooks';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { ChatDialog } from '../../chat/chat-dialog';
import { MilestoneViewDrawer } from '../../milestones/milestone-view-drawer';
import { TimelineDiaperDrawer } from '../diaper/timeline-diaper-drawer';
import { TimelineDoctorVisitDrawer } from '../doctor-visit/timeline-doctor-visit-drawer';
import { TimelineFeedingDrawer } from '../feeding/timeline-feeding-drawer';
import { TimelinePumpingDrawer } from '../pumping/timeline-pumping-drawer';
import { getDisplayNotes } from '../shared/activity-utils';
import {
  formatLengthDisplay,
  formatWeightDisplay,
} from '../shared/measurement-utils';
import { formatMinutesToHoursMinutes } from '../shared/time-formatting-utils';
import { formatVolumeDisplay, getVolumeUnit } from '../shared/volume-utils';
import { TimelineSleepDrawer } from '../sleep/timeline-sleep-drawer';
import type { TimelineItem } from './activity-timeline.actions';
import { getActivitiesAction } from './activity-timeline.actions';
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
] satisfies Array<{
  color: string;
  icon: LucideIcon;
  id: string;
  label: string;
  textColor: string;
}>;

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
  nursing: Droplet,
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
  nursing: 'border-l-activity-feeding',
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
  nursing: 'text-activity-feeding',
  potty: 'text-activity-potty',
  pumping: 'text-activity-pumping',
  sleep: 'text-activity-sleep',
  solids: 'text-activity-solids',
  temperature: 'text-activity-temperature',
  'tummy-time': 'text-activity-tummy-time',
  vitamin_d: 'text-activity-vitamin-d',
};

function groupTimelineItemsByDay(
  items: TimelineItem[],
): Map<string, TimelineItem[]> {
  const grouped = new Map<string, TimelineItem[]>();

  const now = new Date();
  const todayStart = startOfDay(now);

  // Debug: log first few items to see date handling
  if (items.length > 0) {
    const firstTimestamp = items[0]?.timestamp;
    const isValidFirstDate =
      firstTimestamp &&
      firstTimestamp instanceof Date &&
      !Number.isNaN(firstTimestamp.getTime());

    console.log('Timeline grouping - sample dates:', {
      firstItem: {
        iso: isValidFirstDate ? firstTimestamp.toISOString() : 'Invalid date',
        isToday: isValidFirstDate ? isToday(firstTimestamp) : false,
        isValid: isValidFirstDate,
        isYesterday: isValidFirstDate ? isYesterday(firstTimestamp) : false,
        local: isValidFirstDate
          ? firstTimestamp.toLocaleString()
          : 'Invalid date',
        startOfDay: isValidFirstDate
          ? startOfDay(firstTimestamp).toISOString()
          : null,
        timestamp: firstTimestamp,
      },
      now: {
        current: now,
        iso: now.toISOString(),
        local: now.toLocaleString(),
      },
      todayStart: todayStart.toISOString(),
      totalItems: items.length,
    });
  }

  for (const item of items) {
    const itemDate = item.timestamp;

    // Skip items with invalid dates
    if (
      !itemDate ||
      !(itemDate instanceof Date) ||
      Number.isNaN(itemDate.getTime())
    ) {
      console.warn('Skipping timeline item with invalid date:', item);
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

  console.log('Timeline grouped by day:', Array.from(grouped.keys()));

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

// Helper component to wrap timeline drawers with responsive Dialog/Drawer
function TimelineDrawerWrapper({
  children,
  isOpen,
  onClose,
  title,
}: {
  children: React.ReactNode;
  isOpen: boolean;
  onClose: () => void;
  title: string;
}) {
  const isDesktop = useIsDesktop();

  if (isDesktop) {
    return (
      <Dialog onOpenChange={onClose} open={isOpen}>
        <DialogContent
          className="sm:max-w-2xl max-h-[95vh] p-0 gap-0 overflow-hidden flex flex-col"
          showCloseButton={false}
        >
          <DialogTitle className="sr-only">{title}</DialogTitle>
          {children}
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Drawer onOpenChange={(open) => !open && onClose()} open={isOpen}>
      <DrawerContent className="max-h-[95vh] bg-background border-none p-0 overflow-x-hidden">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
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

  // Fetch user preferences for volume display and time format (prefetched on server)
  const [user] = api.user.current.useSuspenseQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');
  const timeFormat = user?.timeFormat || '12h';
  const measurementUnit = user?.measurementUnit || 'metric';

  // Ref for intersection observer
  const loadMoreRef = useRef<HTMLDivElement>(null);

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

  // Use server action for infinite query
  const { execute, result, isPending, hasSucceeded } =
    useAction(getActivitiesAction);

  // State for managing pages
  const [pages, setPages] = useState<
    Array<{ items: TimelineItem[]; nextCursor: string | null }>
  >([]);
  const [currentCursor, setCurrentCursor] = useState<string | null>(null);
  const [isFetchingNextPage, setIsFetchingNextPage] = useState(false);

  // Track if we're in initial load to prevent scroll jumps
  const isInitialLoadRef = useRef(true);

  // Track previous filters to detect changes
  const prevFiltersRef = useRef<string | null>(null);

  // Track tRPC query key changes to detect when data is invalidated
  const utils = api.useUtils();

  // Track when queries are invalidated by checking their updatedAt timestamps
  // This is more reliable than checking the actual data
  const activitiesQueryState = utils.activities.list.getInfiniteData();
  const milestonesQueryState = utils.milestones.list.getInfiniteData();
  const chatsQueryState = utils.chats.list.getInfiniteData();

  // Create a simple invalidation counter based on query state changes
  // Only track meaningful changes, not undefined states during initial load
  const dataQueryKey = useMemo(() => {
    // Use a timestamp-based approach to detect invalidations
    // This prevents false positives from undefined states during initial load
    const timestamp = Date.now();
    return JSON.stringify({
      activities: activitiesQueryState ? timestamp : null,
      chats: chatsQueryState ? timestamp : null,
      milestones: milestonesQueryState ? timestamp : null,
    });
  }, [activitiesQueryState, milestonesQueryState, chatsQueryState]);

  // Load data when filters are ready or change
  useEffect(() => {
    if (!timelineFilters) return;

    const currentFilterKey = JSON.stringify(timelineFilters);

    // Check if this is initial load or filters changed
    if (prevFiltersRef.current !== currentFilterKey) {
      // Reset state for new query
      setPages([]);
      setCurrentCursor(null);
      setIsFetchingNextPage(false);
      isInitialLoadRef.current = true;

      // Execute the query
      execute(timelineFilters);

      // Update prev filters
      prevFiltersRef.current = currentFilterKey;
    }
  }, [timelineFilters, execute]);

  // Refetch when tRPC data is invalidated (e.g., after create/update/delete)
  const prevDataKeyRef = useRef<string | null>(null);
  const hasCompletedInitialLoadRef = useRef(false);

  useEffect(() => {
    // Skip until we've completed at least one successful load
    if (
      hasCompletedInitialLoadRef.current &&
      prevDataKeyRef.current &&
      prevDataKeyRef.current !== dataQueryKey &&
      timelineFilters &&
      !isPending &&
      !isFetchingNextPage &&
      pages.length > 0 // Only refetch if we already have data
    ) {
      console.log(
        '[Invalidation] Refetching first page without cursor to get newest items',
      );
      // Silently refetch first page when data changes
      // IMPORTANT: Pass filters WITHOUT cursor to get the NEWEST items
      // Reset pages to force fresh fetch
      setPages([]);
      setCurrentCursor(null);
      isInitialLoadRef.current = true;
      execute(timelineFilters);
    }
    prevDataKeyRef.current = dataQueryKey;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    dataQueryKey,
    pages.length,
    isFetchingNextPage,
    timelineFilters,
    isPending, // Silently refetch first page when data changes
    execute,
  ]);

  // Handle result updates
  useEffect(() => {
    if (hasSucceeded && result.data) {
      setPages((prev) => {
        if (isInitialLoadRef.current) {
          // Initial load or filter change - replace all pages
          isInitialLoadRef.current = false;
          hasCompletedInitialLoadRef.current = true;
          return [result.data];
        }
        if (isFetchingNextPage) {
          // Append new page to existing pages
          return [...prev, result.data];
        }
        // No change if not loading
        return prev;
      });
      setCurrentCursor(result.data.nextCursor);
      setIsFetchingNextPage(false);
    }
  }, [hasSucceeded, result.data, isFetchingNextPage]);

  // Flatten all pages into a single list
  const serverTimelineItems = useMemo(() => {
    return pages.flatMap((page) =>
      page.items.filter((item) => {
        // Filter out items with invalid timestamps
        const isValid =
          item.timestamp instanceof Date &&
          !Number.isNaN(item.timestamp.getTime());
        if (!isValid) {
          console.warn(
            'Filtered out server timeline item with invalid timestamp:',
            item,
          );
        }
        return isValid;
      }),
    );
  }, [pages]);

  // Merge optimistic activities with timeline items
  const optimisticTimelineItems = useMemo(() => {
    return optimisticActivities
      .map(
        (activity): TimelineItem => ({
          data: activity,
          timestamp: new Date(activity.startTime),
          type: 'activity' as const,
        }),
      )
      .filter((item) => {
        // Filter out items with invalid timestamps
        const isValid =
          item.timestamp instanceof Date &&
          !Number.isNaN(item.timestamp.getTime());
        if (!isValid) {
          console.warn(
            'Filtered out timeline item with invalid timestamp:',
            item,
          );
        }
        return isValid;
      });
  }, [optimisticActivities]);

  // Merge all timeline items and sort by timestamp
  const allTimelineItems = useMemo(() => {
    // Deduplicate optimistic activities - remove optimistic items if a matching real activity exists
    const deduplicatedOptimisticItems = optimisticTimelineItems.filter(
      (optimisticItem) => {
        if (optimisticItem.type !== 'activity') return true;

        // Check if there's a matching real activity (same type, similar timestamp)
        const hasMatchingRealActivity = serverTimelineItems.some((realItem) => {
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

    const merged = [...deduplicatedOptimisticItems, ...serverTimelineItems];

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

    return filtered.sort(
      (a, b) => b.timestamp.getTime() - a.timestamp.getTime(),
    );
  }, [optimisticTimelineItems, serverTimelineItems, selectedActivityTypes]);

  // Fetch next page with ref to prevent multiple simultaneous fetches
  const isFetchingRef = useRef(false);

  const fetchNextPage = useMemo(() => {
    return () => {
      if (
        currentCursor &&
        !isFetchingRef.current &&
        !isFetchingNextPage &&
        !isPending &&
        timelineFilters
      ) {
        isFetchingRef.current = true;
        setIsFetchingNextPage(true);
        execute({
          ...timelineFilters,
          cursor: currentCursor,
        });
      }
    };
  }, [currentCursor, isFetchingNextPage, isPending, timelineFilters, execute]);

  // Reset fetching ref when fetch completes
  useEffect(() => {
    if (!isFetchingNextPage) {
      isFetchingRef.current = false;
    }
  }, [isFetchingNextPage]);

  // Setup intersection observer for infinite scroll
  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const target = entries[0];
        if (target?.isIntersecting && currentCursor && !isFetchingRef.current) {
          fetchNextPage();
        }
      },
      {
        rootMargin: '200px', // Start loading 200px before reaching the element
        threshold: 0.1,
      },
    );

    const currentRef = loadMoreRef.current;
    if (currentRef && currentCursor) {
      observer.observe(currentRef);
    }

    return () => {
      if (currentRef) {
        observer.unobserve(currentRef);
      }
    };
  }, [currentCursor, fetchNextPage]);

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

  // Show loading state on initial load
  if (isPending && pages.length === 0 && !isFetchingNextPage) {
    return (
      <div className="flex flex-col items-center justify-center py-12 px-4">
        <Icons.Spinner className="size-8 text-muted-foreground mb-4" />
        <p className="text-sm text-muted-foreground">Loading timeline...</p>
      </div>
    );
  }

  if (allTimelineItems.length === 0 && !isPending && pages.length > 0) {
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
      {Array.from(groupedItems.entries()).map(
        ([dayLabel, dayItems], groupIndex) => {
          // Create a stable key for each day section
          const dayKey = `${dayLabel}-${dayItems[0]?.timestamp.getTime() || groupIndex}`;
          return (
            <div key={dayKey}>
              <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10 border-b border-border/50 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                  {dayLabel}
                </h3>
                {groupIndex === 0 && (
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
                  const relativeTime = formatDistanceToNow(itemDate, {
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

                  if (item.type === 'activity') {
                    const activity = item.data;
                    itemTitle = activity.type.replace('-', ' ');
                    itemNotes = activity.notes || '';
                    itemId = activity.id;

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
                        details.push(`${activity.duration} min`);
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
                    itemId = chat.id;
                  }

                  const detailsText =
                    details.length > 0 ? ` / ${details.join(', ')}` : '';

                  // Calculate time gap from previous item
                  const previousItem = index > 0 ? dayItems[index - 1] : null;
                  const timeGapMinutes = previousItem
                    ? differenceInMinutes(previousItem.timestamp, itemDate)
                    : 0;
                  const showTimeGap = timeGapMinutes >= 15;

                  return (
                    <div key={itemId}>
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
                            : 'opacity-60 hover:opacity-90 cursor-pointer'
                        } transition-all duration-200 hover:scale-[1.01] hover:shadow-sm w-full text-left`}
                        disabled={isOptimistic}
                        onClick={() => !isOptimistic && handleItemClick(item)}
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
                            <div className="flex flex-col items-end gap-0.5 shrink-0">
                              <span className="text-xs text-muted-foreground whitespace-nowrap">
                                {isOptimistic ? 'Just now' : relativeTime}
                              </span>
                              <span className="text-xs text-muted-foreground/70 font-mono whitespace-nowrap">
                                {absoluteTime}
                              </span>
                            </div>
                          </div>
                          {getDisplayNotes(itemNotes) && (
                            <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2 leading-relaxed">
                              {getDisplayNotes(itemNotes)}
                            </p>
                          )}
                          {isOptimistic && (
                            <p className="text-xs text-primary mt-1">
                              Saving...
                            </p>
                          )}
                        </div>
                      </button>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        },
      )}

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
        {!currentCursor && !isFetchingNextPage && pages.length > 0 && (
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
