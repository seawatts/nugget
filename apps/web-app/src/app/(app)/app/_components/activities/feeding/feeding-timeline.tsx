'use client';

import type { Activities, Users } from '@nugget/db/schema';
import { Avatar, AvatarFallback, AvatarImage } from '@nugget/ui/avatar';
import { differenceInMinutes } from 'date-fns';
import { Droplet, Milk } from 'lucide-react';
import { useMemo, useState } from 'react';
import { formatTimeWithPreference } from '~/lib/format-time';
import type { ActivityWithUser } from '../shared/components/activity-timeline';
import { ScrollableActivityTimeline } from '../shared/components/scrollable-activity-timeline';
import { TimelineDrawerWrapper } from '../shared/components/timeline-drawer-wrapper';
import { formatVolumeDisplay } from '../shared/volume-utils';
import { TimelineFeedingDrawer } from './timeline-feeding-drawer';

// Type for activity with user relation (as returned by activities.list query with user relation)
type ActivityWithUserLegacy = typeof Activities.$inferSelect & {
  user: typeof Users.$inferSelect | null;
};

interface FeedingTimelineProps {
  feedings: Array<ActivityWithUserLegacy>;
  timeFormat: '12h' | '24h';
  userUnitPref: 'ML' | 'OZ';
  babyId: string;
}

export function FeedingTimeline({
  feedings,
  timeFormat,
  userUnitPref,
  babyId,
}: FeedingTimelineProps) {
  const [editingActivity, setEditingActivity] =
    useState<ActivityWithUser | null>(null);
  const [editDrawerOpen, setEditDrawerOpen] = useState(false);

  const handleFeedingClick = (feeding: ActivityWithUserLegacy) => {
    setEditingActivity(feeding as unknown as ActivityWithUser);
    setEditDrawerOpen(true);
  };

  const handleDrawerClose = () => {
    setEditDrawerOpen(false);
    setEditingActivity(null);
  };

  // Get last 4 feedings, sorted by time (oldest first)
  const recentFeedings = useMemo(() => {
    const filtered = feedings
      .filter((feeding) => {
        return (
          (feeding.type === 'bottle' ||
            feeding.type === 'nursing' ||
            feeding.type === 'feeding' ||
            feeding.type === 'solids') &&
          !feeding.isScheduled &&
          !(
            feeding.details &&
            'skipped' in feeding.details &&
            feeding.details.skipped === true
          )
        );
      })
      .sort(
        (a, b) =>
          new Date(b.startTime).getTime() - new Date(a.startTime).getTime(),
      ) // Most recent first
      .slice(0, 4) // Take last 4
      .reverse(); // Reverse to show oldest to newest (left to right)

    return filtered;
  }, [feedings]);

  // If no feedings, use ScrollableActivityTimeline instead
  if (recentFeedings.length === 0) {
    return (
      <ScrollableActivityTimeline
        activityCount={10}
        activityTypes={['bottle', 'nursing', 'feeding', 'solids']}
        babyId={babyId}
        className="mt-10"
        iconColorClass="text-activity-feeding"
        lineColorClass="bg-activity-feeding/30 group-hover:bg-activity-feeding/50"
        onActivityClick={(activity) => {
          setEditingActivity(activity);
          setEditDrawerOpen(true);
        }}
        showActivityDetails={true}
        timeFormat={timeFormat}
        userUnitPref={userUnitPref}
      />
    );
  }

  // Calculate position for each feeding (evenly spaced: 0% for first, 100% for last)
  // Middle items are positioned at 35% and 65% instead of 33.333% and 66.667%
  const getPosition = (index: number): number => {
    if (recentFeedings.length === 1) return 50; // Center if only one
    if (recentFeedings.length === 4) {
      // Special positioning for 4 items
      if (index === 0) return 0;
      if (index === 1) return 35;
      if (index === 2) return 65;
      if (index === 3) return 100;
    }
    // Default: evenly spaced
    return (index / (recentFeedings.length - 1)) * 100;
  };

  // Format time interval between feedings (e.g., "1h 30min")
  const formatInterval = (minutes: number): string => {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const mins = minutes % 60;
      if (mins === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${mins}min`;
    }
    return `${minutes}min`;
  };

  // Get icon for feeding type
  const getFeedingIcon = (type: string) => {
    switch (type) {
      case 'bottle':
        return Milk;
      case 'nursing':
        return Droplet;
      default:
        return Milk;
    }
  };

  return (
    <>
      <div className="mt-10 space-y-3 -mx-6 px-2">
        {/* Timeline track */}
        <div className="relative px-6 w-full">
          {/* Timeline with segments between icons using flex */}
          <div className="flex items-center h-1 w-full">
            {recentFeedings.map((feeding, index) => {
              const ActivityIcon = getFeedingIcon(feeding.type);
              const isLast = index === recentFeedings.length - 1;

              // Get user info for avatar - always show avatar, use fallback if no user
              const user = feeding.user;
              const userInitials = user
                ? (user.firstName?.[0] || user.email[0] || '?').toUpperCase()
                : '?';
              const userName = user
                ? [user.firstName, user.lastName].filter(Boolean).join(' ') ||
                  user.email
                : 'Unknown';
              const userAvatarUrl = user?.avatarUrl || null;

              // Calculate interval for line segment (except for last icon)
              const nextFeeding = !isLast ? recentFeedings[index + 1] : null;
              const intervalMinutes = nextFeeding
                ? differenceInMinutes(
                    new Date(nextFeeding.startTime),
                    new Date(feeding.startTime),
                  )
                : null;

              return (
                <div
                  className={`flex items-center min-w-0 ${!isLast ? 'flex-1' : ''}`}
                  key={feeding.id}
                >
                  {/* Icon container */}
                  <div className="relative shrink-0 z-10">
                    <button
                      className="relative flex flex-col items-center cursor-pointer hover:opacity-80 transition-opacity"
                      onClick={() => handleFeedingClick(feeding)}
                      type="button"
                    >
                      {/* Avatar above icon - positioned absolutely - always show */}
                      <div className="absolute -top-6 left-1/2 -translate-x-1/2">
                        <Avatar className="size-4 shrink-0">
                          <AvatarImage
                            alt={userName}
                            src={userAvatarUrl || undefined}
                          />
                          <AvatarFallback className="text-[8px]">
                            {userInitials}
                          </AvatarFallback>
                        </Avatar>
                      </div>
                      {/* Icon - always on the line */}
                      <ActivityIcon className="size-5 text-white/90" />
                    </button>
                  </div>

                  {/* Line segment after icon (except for last) */}
                  {!isLast && (
                    <div className="relative flex-1 h-1 min-w-0">
                      {/* Line segment */}
                      <div className="absolute inset-0 rounded-full bg-white/70" />
                      {/* Duration label */}
                      {intervalMinutes !== null && (
                        <div className="absolute -top-7 left-1/2 -translate-x-1/2">
                          <span className="text-xs font-medium text-white/80 whitespace-nowrap">
                            {formatInterval(intervalMinutes)}
                          </span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* Bottom row: exact time + amount */}
        <div className="relative px-6 w-full min-h-[35px] pt-1">
          {recentFeedings.map((feeding, index) => {
            const feedingTime = new Date(feeding.startTime);
            const exactTime = formatTimeWithPreference(feedingTime, timeFormat);
            const position = getPosition(index);
            const isFirst = index === 0;
            const isLast = index === recentFeedings.length - 1;

            // Format amount for display
            const amountDisplay =
              feeding.type === 'nursing' && feeding.duration
                ? (() => {
                    // Get side information from details
                    const details = feeding.details as {
                      side?: 'left' | 'right' | 'both';
                      type: 'nursing';
                    } | null;
                    const side = details?.side;
                    const sideIndicator =
                      side === 'left' ? ' (L)' : side === 'right' ? ' (R)' : '';
                    return `${feeding.duration} min${sideIndicator}`;
                  })()
                : feeding.amountMl != null
                  ? formatVolumeDisplay(feeding.amountMl, userUnitPref, true)
                  : null;

            // Determine alignment based on position
            let alignmentClass = 'items-center';
            let transformClass = '-translate-x-1/2';
            let leftStyle = `${position}%`;

            if (isFirst) {
              alignmentClass = 'items-start';
              transformClass = 'translate-x-0';
              // Position at icon center, then offset to left edge, then add padding
              leftStyle = `calc(${position}% - 0.625rem + 2.5rem)`;
            } else if (isLast) {
              alignmentClass = 'items-end';
              transformClass = '-translate-x-full';
              // Position at icon center, then offset to right edge, then subtract padding
              leftStyle = `calc(${position}% + 0.625rem - 2.5rem)`;
            }

            return (
              <button
                className={`absolute top-1 flex flex-col gap-0.5 ${alignmentClass} ${transformClass} cursor-pointer hover:opacity-80 transition-opacity`}
                key={`time-${feeding.id}`}
                onClick={() => handleFeedingClick(feeding)}
                style={{ left: leftStyle }}
                type="button"
              >
                <span className="text-xs font-medium text-white/90 leading-tight whitespace-nowrap">
                  {exactTime}
                </span>
                {amountDisplay && (
                  <span className="text-xs text-white/80 leading-tight whitespace-nowrap">
                    {amountDisplay}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* Edit Drawer */}
      {editingActivity &&
        (editingActivity.type === 'feeding' ||
          editingActivity.type === 'nursing' ||
          editingActivity.type === 'bottle' ||
          editingActivity.type === 'solids') &&
        editDrawerOpen && (
          <TimelineDrawerWrapper
            isOpen={editDrawerOpen}
            onClose={handleDrawerClose}
            title="Edit Feeding"
          >
            <TimelineFeedingDrawer
              babyId={babyId}
              existingActivity={
                editingActivity as typeof Activities.$inferSelect
              }
              isOpen={editDrawerOpen}
              onClose={handleDrawerClose}
            />
          </TimelineDrawerWrapper>
        )}
    </>
  );
}
