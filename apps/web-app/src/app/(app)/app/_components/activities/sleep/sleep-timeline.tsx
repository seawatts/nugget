'use client';

import type { ActivityWithUser } from '../shared/components/activity-timeline';
import { getActivityEndTime } from '../shared/components/activity-timeline';
import { ScrollableActivityTimeline } from '../shared/components/scrollable-activity-timeline';

interface SleepTimelineProps {
  startTime: Date;
  setStartTime: (date: Date) => void;
  endTime: Date;
  setEndTime: (date: Date) => void;
  timeFormat: '12h' | '24h';
  babyId: string;
  onDurationClick?: (startTime: Date, endTime: Date) => void;
}

export function SleepTimeline({
  startTime: _startTime,
  setStartTime,
  endTime: _endTime,
  setEndTime,
  timeFormat,
  babyId,
  onDurationClick,
}: SleepTimelineProps) {
  // Handle clicking on duration segment between activities
  // previousActivity = the activity before the segment (the one we're rendering the segment after)
  // nextActivity = the activity after the segment (or null for "now")
  const handleDurationClick = (
    previousActivity: ActivityWithUser | null,
    nextActivity: ActivityWithUser | null,
  ) => {
    let newStartTime: Date;
    let newEndTime: Date;

    if (previousActivity) {
      // Set start time to end of previous activity (the one before the segment)
      newStartTime = getActivityEndTime(previousActivity);
    } else {
      // This shouldn't happen, but fallback to current time
      newStartTime = new Date();
    }

    if (nextActivity) {
      // Set end time to start of next activity
      newEndTime = new Date(nextActivity.startTime);
    } else {
      // If clicking after last activity (before "now"), set end time to current time
      newEndTime = new Date();
    }

    // If custom handler provided, use it (for auto-selecting custom mode)
    if (onDurationClick) {
      onDurationClick(newStartTime, newEndTime);
    } else {
      // Otherwise use the default handlers
      setStartTime(newStartTime);
      setEndTime(newEndTime);
    }
  };

  return (
    <ScrollableActivityTimeline
      activityCount={10}
      babyId={babyId}
      iconColorClass="text-activity-sleep"
      lineColorClass="bg-activity-sleep/30 group-hover:bg-activity-sleep/50"
      onDurationClick={handleDurationClick}
      showNowIcon={true}
      timeFormat={timeFormat}
    />
  );
}
