'use client';

import { api } from '@nugget/api/react';
import type { Activities, Chats, Milestones } from '@nugget/db/schema';
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
import { useMemo, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import { useOptimisticActivitiesStore } from '~/stores/optimistic-activities';
import { ChatDialog } from '../../chat/chat-dialog';
import { MilestoneViewDrawer } from '../../milestones/milestone-view-drawer';
import { TimelineDiaperDrawer } from '../diaper/timeline-diaper-drawer';
import { TimelineFeedingDrawer } from '../feeding/timeline-feeding-drawer';
import { TimelinePumpingDrawer } from '../pumping/timeline-pumping-drawer';
import { getDisplayNotes } from '../shared/activity-utils';
import {
  formatLengthDisplay,
  formatWeightDisplay,
} from '../shared/measurement-utils';
import { formatVolumeDisplay, getVolumeUnit } from '../shared/volume-utils';
import { TimelineSleepDrawer } from '../sleep/timeline-sleep-drawer';
import type { TimelineItem } from './activity-timeline.actions';
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
      <DrawerContent className="max-h-[95vh] bg-background border-none p-0">
        <DrawerTitle className="sr-only">{title}</DrawerTitle>
        {children}
      </DrawerContent>
    </Drawer>
  );
}

export function ActivityTimeline() {
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

  // Get the most recent baby using tRPC suspense query (prefetched on server)
  const [baby] = api.babies.getMostRecent.useSuspenseQuery();

  // Get optimistic activities from Zustand store
  const optimisticActivities = useOptimisticActivitiesStore.use.activities();

  // Fetch user preferences for volume display and time format (prefetched on server)
  const [user] = api.user.current.useSuspenseQuery();
  const userUnitPref = getVolumeUnit(user?.measurementUnit || 'metric');
  const timeFormat = user?.timeFormat || '12h';
  const measurementUnit = user?.measurementUnit || 'metric';

  // Build filters for activities query
  const activityFilters = useMemo(() => {
    if (!baby?.id) return null;

    // Check if any actual activity types are selected (excluding milestone, chat, and skipped)
    const activityTypesList = selectedActivityTypes.filter(
      (type) => type !== 'milestone' && type !== 'chat' && type !== 'skipped',
    );
    const shouldFetchActivities =
      selectedActivityTypes.length === 0 || activityTypesList.length > 0;

    if (!shouldFetchActivities) return null;

    return {
      activityTypes:
        activityTypesList.length > 0 ? activityTypesList : undefined,
      babyId: baby.id,
      isScheduled: false,
      limit: 100,
      // Don't pass userIds filter at all - show activities from all family members
      // The filter in the UI is just for display purposes
    };
  }, [baby?.id, selectedActivityTypes]);

  // Fetch activities using tRPC suspense query (prefetched on server)
  const [activitiesData = []] = api.activities.list.useSuspenseQuery(
    activityFilters ?? { babyId: baby?.id || '', isScheduled: false, limit: 0 },
  );

  // Build filters for milestones query
  const milestonesFilters = useMemo(() => {
    if (!baby?.id) return null;

    const shouldFetchMilestones =
      selectedActivityTypes.length === 0 ||
      selectedActivityTypes.includes('milestone');

    if (!shouldFetchMilestones) return null;

    return {
      babyId: baby.id,
      limit: 100,
    };
  }, [baby?.id, selectedActivityTypes]);

  // Fetch milestones using tRPC suspense query (prefetched on server)
  const [milestonesData = []] = api.milestones.list.useSuspenseQuery(
    milestonesFilters ?? { babyId: baby?.id || '', limit: 0 },
  );

  // Filter to only achieved milestones and convert to timeline items
  const milestoneTimelineItems = useMemo(() => {
    return milestonesData
      .filter((m) => m.achievedDate)
      .map(
        (milestone): TimelineItem => ({
          data: milestone,
          timestamp: new Date(milestone.achievedDate ?? new Date()),
          type: 'milestone' as const,
        }),
      );
  }, [milestonesData]);

  // Build filters for chats query
  const chatsFilters = useMemo(() => {
    if (!baby?.id) return null;

    const shouldFetchChats =
      selectedActivityTypes.length === 0 ||
      selectedActivityTypes.includes('chat');

    if (!shouldFetchChats) return null;

    return {
      babyId: baby.id,
      limit: 100,
    };
  }, [baby?.id, selectedActivityTypes]);

  // Fetch chats using tRPC suspense query
  const [chatsData = []] = api.chats.list.useSuspenseQuery(
    chatsFilters ?? { babyId: baby?.id || '', limit: 0 },
  );

  // Convert chats to timeline items
  const chatTimelineItems = useMemo(() => {
    return chatsData.map(
      (chatMessage): TimelineItem => ({
        data: chatMessage as typeof chatMessage & {
          chat: typeof Chats.$inferSelect;
        },
        timestamp: new Date(chatMessage.createdAt),
        type: 'chat' as const,
      }),
    );
  }, [chatsData]);

  // Convert activities to timeline items
  const activityTimelineItems = useMemo(() => {
    return activitiesData.map(
      (activity): TimelineItem => ({
        data: activity,
        timestamp: new Date(activity.startTime),
        type: 'activity' as const,
      }),
    );
  }, [activitiesData]);

  // Merge optimistic activities with timeline items
  const optimisticTimelineItems = useMemo(() => {
    return optimisticActivities.map(
      (activity): TimelineItem => ({
        data: activity,
        timestamp: new Date(activity.startTime),
        type: 'activity' as const,
      }),
    );
  }, [optimisticActivities]);

  // Merge all timeline items and sort by timestamp
  const allTimelineItems = useMemo(() => {
    const merged = [
      ...optimisticTimelineItems,
      ...activityTimelineItems,
      ...milestoneTimelineItems,
      ...chatTimelineItems,
    ];

    // Check if skipped activities should be shown
    const showSkipped =
      selectedActivityTypes.length === 0 ||
      selectedActivityTypes.includes('skipped');

    // Apply filters
    const filtered = merged.filter((item) => {
      // Filter by user if userIds are selected
      if (selectedUserIds.length > 0 && item.type === 'activity') {
        const activity = item.data;
        if (!selectedUserIds.includes(activity.userId)) {
          return false;
        }
      }

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
  }, [
    optimisticTimelineItems,
    activityTimelineItems,
    milestoneTimelineItems,
    chatTimelineItems,
    selectedUserIds,
    selectedActivityTypes,
  ]);

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
          <div key={dayLabel}>
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
                    details.push(`${activity.duration} min`);
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
              babyId={baby?.id}
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
            babyId={baby?.id}
            existingActivity={editingActivity}
            isOpen={true}
            onClose={handleDrawerClose}
          />
        </TimelineDrawerWrapper>
      )}

      {/* Diaper Drawer */}
      {editingActivity && openDrawer === 'diaper' && (
        <TimelineDrawerWrapper
          isOpen={true}
          onClose={handleDrawerClose}
          title="Edit Diaper"
        >
          <TimelineDiaperDrawer
            babyId={baby?.id}
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
            babyId={baby?.id}
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
