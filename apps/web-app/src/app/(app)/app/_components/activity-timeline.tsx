'use client';

import { api } from '@nugget/api/react';
import type { Activities } from '@nugget/db/schema';
import { Icons } from '@nugget/ui/custom/icons';
import {
  differenceInMinutes,
  format,
  formatDistanceToNow,
  isToday,
  isYesterday,
} from 'date-fns';
import type { LucideIcon } from 'lucide-react';
import {
  Activity,
  Award,
  Baby,
  Bath,
  Droplet,
  Droplets,
  MessageSquare,
  Milk,
  Moon,
  Pill,
  Scale,
  Thermometer,
  Timer,
  Tablet as Toilet,
  UtensilsCrossed,
} from 'lucide-react';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ActivityDrawer } from '~/app/(app)/app/_components/activity-drawer';
import { ActivityTimelineFilters } from '~/app/(app)/app/_components/activity-timeline-filters';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import {
  getActivitiesAction,
  type TimelineItem,
} from './activity-timeline.actions';
import { getDisplayNotes } from './activity-utils';
import { ChatDialog } from './chat-dialog';
import { formatVolumeDisplay, getVolumeUnit } from './volume-utils';

const activities = [
  {
    color: 'bg-[oklch(0.75_0.15_195)]',
    icon: Moon,
    id: 'sleep',
    label: 'Sleep',
    textColor: 'text-[oklch(0.18_0.02_250)]',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    icon: Droplet,
    id: 'nursing',
    label: 'Nursing',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_35)]',
    icon: Milk,
    id: 'bottle',
    label: 'Bottle',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.72_0.16_330)]',
    icon: UtensilsCrossed,
    id: 'solids',
    label: 'Solids',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    icon: Baby,
    id: 'diaper',
    label: 'Diaper',
    textColor: 'text-[oklch(0.18_0.02_60)]',
  },
  {
    color: 'bg-[oklch(0.65_0.18_280)]',
    icon: Droplets,
    id: 'pumping',
    label: 'Pumping',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.78_0.14_60)]',
    icon: Toilet,
    id: 'potty',
    label: 'Potty',
    textColor: 'text-[oklch(0.18_0.02_60)]',
  },
  {
    color: 'bg-[oklch(0.70_0.16_150)]',
    icon: Activity,
    id: 'activity',
    label: 'Activity',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.70_0.16_150)]',
    icon: Timer,
    id: 'tummy-time',
    label: 'Tummy Time',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_10)]',
    icon: Pill,
    id: 'medicine',
    label: 'Medicine',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.68_0.18_10)]',
    icon: Thermometer,
    id: 'temperature',
    label: 'Temperature',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    icon: Scale,
    id: 'growth',
    label: 'Growth',
    textColor: 'text-white',
  },
  {
    color: 'bg-[oklch(0.62_0.18_260)]',
    icon: Bath,
    id: 'bath',
    label: 'Bath',
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
  activity: 'border-l-[oklch(0.70_0.16_150)]',
  bath: 'border-l-[oklch(0.62_0.18_260)]',
  bottle: 'border-l-[oklch(0.68_0.18_35)]',
  chat: 'border-l-[oklch(0.60_0.20_220)]',
  diaper: 'border-l-[oklch(0.78_0.14_60)]',
  growth: 'border-l-[oklch(0.62_0.18_260)]',
  medicine: 'border-l-[oklch(0.68_0.18_10)]',
  milestone: 'border-l-[oklch(0.75_0.18_85)]',
  nursing: 'border-l-[oklch(0.68_0.18_35)]',
  potty: 'border-l-[oklch(0.78_0.14_60)]',
  pumping: 'border-l-[oklch(0.65_0.18_280)]',
  sleep: 'border-l-[oklch(0.75_0.15_195)]',
  solids: 'border-l-[oklch(0.72_0.16_330)]',
  temperature: 'border-l-[oklch(0.68_0.18_10)]',
  'tummy-time': 'border-l-[oklch(0.70_0.16_150)]',
};

const activityIconColors: Record<string, string> = {
  activity: 'text-[oklch(0.70_0.16_150)]',
  bath: 'text-[oklch(0.62_0.18_260)]',
  bottle: 'text-[oklch(0.68_0.18_35)]',
  chat: 'text-[oklch(0.60_0.20_220)]',
  diaper: 'text-[oklch(0.78_0.14_60)]',
  growth: 'text-[oklch(0.62_0.18_260)]',
  medicine: 'text-[oklch(0.68_0.18_10)]',
  milestone: 'text-[oklch(0.75_0.18_85)]',
  nursing: 'text-[oklch(0.68_0.18_35)]',
  potty: 'text-[oklch(0.78_0.14_60)]',
  pumping: 'text-[oklch(0.65_0.18_280)]',
  sleep: 'text-[oklch(0.75_0.15_195)]',
  solids: 'text-[oklch(0.72_0.16_330)]',
  temperature: 'text-[oklch(0.68_0.18_10)]',
  'tummy-time': 'text-[oklch(0.70_0.16_150)]',
};

function groupTimelineItemsByDay(
  items: TimelineItem[],
): Map<string, TimelineItem[]> {
  const grouped = new Map<string, TimelineItem[]>();

  for (const item of items) {
    const itemDate = item.timestamp;
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

export function ActivityTimeline() {
  const [timelineItems, setTimelineItems] = useState<TimelineItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [openDrawer, setOpenDrawer] = useState<string | null>(null);
  const [editingActivity, setEditingActivity] = useState<
    typeof Activities.$inferSelect | null
  >(null);
  const [selectedUserIds, setSelectedUserIds] = useState<string[]>([]);
  const [selectedItemTypes, setSelectedItemTypes] = useState<string[]>([]);
  const [selectedActivityTypes, setSelectedActivityTypes] = useState<string[]>(
    [],
  );
  const [isInitialLoad, setIsInitialLoad] = useState(true);
  const [chatDialogOpen, setChatDialogOpen] = useState(false);
  const [selectedChatData, setSelectedChatData] = useState<{
    chatId: string;
    babyId: string;
  } | null>(null);
  const observerRef = useRef<IntersectionObserver | null>(null);
  const loadMoreRef = useRef<HTMLDivElement>(null);

  // Get optimistic activities from Zustand store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Fetch user preferences for volume display
  const { data: user } = api.user.current.useQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');

  // Merge optimistic activities with timeline items
  const allTimelineItems = useMemo(() => {
    const optimisticTimelineItems: TimelineItem[] = optimisticActivities.map(
      (activity) => ({
        data: activity,
        timestamp: new Date(activity.startTime),
        type: 'activity' as const,
      }),
    );
    return [...optimisticTimelineItems, ...timelineItems];
  }, [optimisticActivities, timelineItems]);

  const loadActivities = useCallback(
    async (offset = 0, append = false, skipAnimation = false) => {
      try {
        if (offset === 0) {
          setLoading(true);
        } else {
          setLoadingMore(true);
        }

        const result = await getActivitiesAction({
          activityTypes:
            selectedActivityTypes.length > 0
              ? selectedActivityTypes
              : undefined,
          itemTypes:
            selectedItemTypes.length > 0
              ? (selectedItemTypes as Array<'activity' | 'milestone' | 'chat'>)
              : undefined,
          limit: 30,
          offset,
          userIds: selectedUserIds.length > 0 ? selectedUserIds : undefined,
        });

        if (result?.data) {
          const { items: newItems, hasMore: more } = result.data;
          if (append) {
            setTimelineItems((prev) => [...prev, ...newItems]);
          } else {
            setTimelineItems(newItems);
          }
          setHasMore(more);
          // Disable animations after initial load if skipAnimation is true
          if (skipAnimation && isInitialLoad) {
            setIsInitialLoad(false);
          }
        } else if (result?.serverError) {
          setError(result.serverError);
        }
      } catch (err) {
        setError(
          err instanceof Error ? err.message : 'Failed to load timeline items',
        );
      } finally {
        setLoading(false);
        setLoadingMore(false);
      }
    },
    [selectedUserIds, selectedItemTypes, selectedActivityTypes, isInitialLoad],
  );

  // Initial load
  useEffect(() => {
    loadActivities(0, false, false);
    // Mark as no longer initial load after first load
    setIsInitialLoad(false);
  }, [loadActivities]);

  // Set up intersection observer for infinite scroll
  useEffect(() => {
    if (!hasMore || loadingMore) return;

    observerRef.current = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && !loadingMore && hasMore) {
          loadActivities(allTimelineItems.length, true, true);
        }
      },
      { threshold: 0.1 },
    );

    if (loadMoreRef.current) {
      observerRef.current.observe(loadMoreRef.current);
    }

    return () => {
      if (observerRef.current) {
        observerRef.current.disconnect();
      }
    };
  }, [allTimelineItems.length, hasMore, loadActivities, loadingMore]);

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
    }
    // For milestones, we can add handlers later
  };

  const handleDrawerClose = () => {
    setOpenDrawer(null);
    setEditingActivity(null);
  };

  const handleFilterChange = (
    userIds: string[],
    itemTypes: string[],
    activityTypes: string[],
  ) => {
    setSelectedUserIds(userIds);
    setSelectedItemTypes(itemTypes);
    setSelectedActivityTypes(activityTypes);
    // Reload activities from the beginning (with animation since it's a user action)
    loadActivities(0, false, false);
  };

  const groupedItems = groupTimelineItemsByDay(allTimelineItems);

  if (loading) {
    return (
      <div className="flex flex-col gap-3">
        {[1, 2, 3].map((i) => (
          <div className="h-20 bg-muted/30 rounded-xl animate-pulse" key={i} />
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-destructive/10 border border-destructive/30 rounded-xl">
        <p className="text-sm text-destructive">{error}</p>
      </div>
    );
  }

  if (allTimelineItems.length === 0) {
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
        ([dayLabel, dayItems], groupIndex) => (
          <div
            className={isInitialLoad ? 'animate-in fade-in duration-300' : ''}
            key={dayLabel}
          >
            <div className="sticky top-0 bg-background/95 backdrop-blur-sm py-2 mb-3 z-10 border-b border-border/50 flex items-center justify-between">
              <h3 className="text-sm font-semibold text-foreground/70 uppercase tracking-wide">
                {dayLabel}
              </h3>
              {groupIndex === 0 && (
                <ActivityTimelineFilters
                  activityTypes={activities}
                  onFilterChange={handleFilterChange}
                  selectedActivityTypes={selectedActivityTypes}
                  selectedItemTypes={selectedItemTypes}
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
                const absoluteTime = format(itemDate, 'h:mm a');
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

                if (item.type === 'activity') {
                  const activity = item.data;
                  itemTitle = activity.type.replace('-', ' ');
                  itemNotes = activity.notes || '';
                  itemId = activity.id;

                  if (activity.duration) {
                    details.push(`${activity.duration} min`);
                  }
                  if (activity.amount) {
                    details.push(
                      formatVolumeDisplay(activity.amount, userUnitPref, true),
                    );
                  }

                  // Add diaper type details
                  if (activity.type === 'diaper' && activity.details) {
                    const diaperDetails = activity.details as {
                      type?: string;
                      wet?: boolean;
                      dirty?: boolean;
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
                      } transition-all duration-200 hover:scale-[1.01] hover:shadow-sm ${isInitialLoad ? 'animate-in slide-in-from-bottom-2' : ''} w-full text-left`}
                      disabled={
                        isOptimistic ||
                        (item.type !== 'activity' && item.type !== 'chat')
                      }
                      onClick={() => !isOptimistic && handleItemClick(item)}
                      style={
                        isInitialLoad
                          ? {
                              animationDelay: `${index * 30}ms`,
                              animationFillMode: 'backwards',
                            }
                          : undefined
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
                          <div className="flex-1 min-w-0">
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
                          <p className="text-xs text-primary mt-1">Saving...</p>
                        )}
                      </div>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        ),
      )}

      {hasMore && (
        <div className="flex justify-center py-6" ref={loadMoreRef}>
          {loadingMore && (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Icons.Spinner className="size-5" />
              <span className="text-sm">Loading more...</span>
            </div>
          )}
        </div>
      )}

      {!hasMore && allTimelineItems.length > 0 && (
        <div className="flex justify-center py-6">
          <p className="text-xs text-muted-foreground">
            That's all your timeline items
          </p>
        </div>
      )}

      {/* Activity Drawers */}
      {activities.map((activityType) => (
        <ActivityDrawer
          activity={activityType}
          existingActivity={
            openDrawer === activityType.id ? editingActivity : null
          }
          isOpen={openDrawer === activityType.id}
          key={activityType.id}
          onClose={handleDrawerClose}
        />
      ))}

      {/* Chat Dialog */}
      {selectedChatData && (
        <ChatDialog
          babyId={selectedChatData.babyId}
          chatId={selectedChatData.chatId}
          onOpenChange={setChatDialogOpen}
          open={chatDialogOpen}
        />
      )}
    </div>
  );
}
