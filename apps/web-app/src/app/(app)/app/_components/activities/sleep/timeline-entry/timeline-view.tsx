'use client';

/**
 * TimelineView Component
 * Main 12-hour vertical timeline visualization showing all activities
 */

import type { Activities } from '@nugget/db/schema';
import { useEffect, useMemo, useRef, useState } from 'react';
import { formatHour } from '../../shared/utils/frequency-utils';
import { ActivityBar } from './activity-bar';
import { SleepDurationSelector } from './sleep-duration-selector';
import {
  assignActivityLanes,
  formatActivitiesForTimeline,
} from './utils/activity-formatting';
import type {
  ActivityPosition,
  TimelineWindow,
} from './utils/timeline-calculations';
import {
  calculateActivityPosition,
  calculateHourMarkers,
  calculateTimelineWindow,
  filterActivitiesInWindow,
  percentToTime,
} from './utils/timeline-calculations';

interface TimelineViewProps {
  activities: Array<typeof Activities.$inferSelect>;
  window?: TimelineWindow; // Optional: custom window, otherwise centered on now
  selectedSleepStart?: Date;
  selectedSleepEnd?: Date;
  onSleepTimeChange?: (startTime: Date, endTime: Date) => void;
  onEmptySpaceClick?: (clickTime: Date) => void;
  timeFormat?: '12h' | '24h';
  excludeActivityId?: string; // For editing existing activities
}

export function TimelineView({
  activities,
  window: providedWindow,
  selectedSleepStart,
  selectedSleepEnd,
  onSleepTimeChange,
  onEmptySpaceClick,
  timeFormat = '12h',
  excludeActivityId,
}: TimelineViewProps) {
  const timelineContainerRef = useRef<HTMLDivElement>(null);
  const [isDraggingSleep, setIsDraggingSleep] = useState(false);
  const ignoreClickRef = useRef(false);
  const dragEndTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Use refs to track current values during dragging to avoid stale closures
  const currentStartRef = useRef(selectedSleepStart);
  const currentEndRef = useRef(selectedSleepEnd);

  useEffect(() => {
    currentStartRef.current = selectedSleepStart;
    currentEndRef.current = selectedSleepEnd;
  }, [selectedSleepStart, selectedSleepEnd]);

  useEffect(() => {
    return () => {
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
    };
  }, []);

  // Calculate timeline window (12 hours centered on current time)
  const window = useMemo(
    () => providedWindow || calculateTimelineWindow(),
    [providedWindow],
  );

  // Filter activities within the window, excluding the activity being edited
  const filteredActivities = useMemo(() => {
    const all = filterActivitiesInWindow(activities, window);
    return excludeActivityId
      ? all.filter((a) => a.id !== excludeActivityId)
      : all;
  }, [activities, window, excludeActivityId]);

  // Calculate positions for all activities
  const activityPositions = useMemo(() => {
    const positions = new Map<string, ActivityPosition>();
    for (const activity of filteredActivities) {
      const position = calculateActivityPosition(activity, window);
      if (position) {
        positions.set(activity.id, position);
      }
    }
    return positions;
  }, [filteredActivities, window]);

  // Filter activities to only those with valid positions, then format for display
  const timelineActivities = useMemo(() => {
    const activitiesWithPositions = filteredActivities.filter((activity) =>
      activityPositions.has(activity.id),
    );
    return assignActivityLanes(
      formatActivitiesForTimeline(
        activitiesWithPositions,
        activityPositions,
        timeFormat,
      ),
    );
  }, [filteredActivities, activityPositions, timeFormat]);

  // Calculate hour markers
  const hourMarkers = useMemo(() => calculateHourMarkers(window), [window]);

  // Handle click on empty space
  const handleTimelineClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!onEmptySpaceClick || isDraggingSleep) return;
    if (ignoreClickRef.current) {
      ignoreClickRef.current = false;
      return;
    }

    const rect = e.currentTarget.getBoundingClientRect();
    const y = e.clientY - rect.top;
    const percent = (y / rect.height) * 100;
    const clickTime = percentToTime(percent, window);

    onEmptySpaceClick(clickTime);
  };

  const handleDragStateChange = (dragging: boolean) => {
    setIsDraggingSleep(dragging);
    if (!dragging) {
      ignoreClickRef.current = true;
      if (dragEndTimeoutRef.current) {
        clearTimeout(dragEndTimeoutRef.current);
      }
      dragEndTimeoutRef.current = setTimeout(() => {
        ignoreClickRef.current = false;
        dragEndTimeoutRef.current = null;
      }, 150);
    }
  };

  // Handle sleep time changes from duration selector
  // Use refs to get the latest values to avoid stale closures
  const handleSleepStartChange = (newStart: Date) => {
    // Update ref optimistically
    currentStartRef.current = newStart;
    const latestEnd = currentEndRef.current || selectedSleepEnd;
    if (latestEnd && onSleepTimeChange) {
      onSleepTimeChange(newStart, latestEnd);
    }
  };

  const handleSleepEndChange = (newEnd: Date) => {
    // Update ref optimistically
    currentEndRef.current = newEnd;
    const latestStart = currentStartRef.current || selectedSleepStart;
    if (latestStart && onSleepTimeChange) {
      onSleepTimeChange(latestStart, newEnd);
    }
  };

  return (
    <div className="w-full space-y-4">
      {/* Timeline Container */}
      <div className="relative w-full bg-muted/20 rounded-lg border border-muted-foreground/10 overflow-hidden">
        <div className="flex">
          {/* Time axis (left side) */}
          <div className="flex flex-col justify-between py-4 px-3 min-w-[60px]">
            {hourMarkers
              .filter((marker) => marker.percent >= 0 && marker.percent <= 100)
              .map((marker) => (
                <div
                  className="text-xs text-muted-foreground whitespace-nowrap"
                  key={`marker-${marker.hour}-${marker.percent}`}
                  style={{
                    position: 'absolute',
                    top: `${marker.percent}%`,
                    transform: 'translateY(-50%)',
                  }}
                >
                  {formatHour(marker.hour, timeFormat)}
                </div>
              ))}
          </div>

          {/* Timeline area */}
          <div
            className="relative flex-1 min-h-[600px] cursor-pointer"
            onClick={handleTimelineClick}
            onKeyDown={(e) => {
              if (onEmptySpaceClick && (e.key === 'Enter' || e.key === ' ')) {
                e.preventDefault();
                // Use center of timeline for keyboard interaction
                const percent = 50;
                const clickTime = percentToTime(percent, window);
                onEmptySpaceClick(clickTime);
              }
            }}
            ref={timelineContainerRef}
            role={onEmptySpaceClick ? 'button' : undefined}
            style={{ touchAction: 'none' }}
            tabIndex={onEmptySpaceClick ? 0 : undefined}
          >
            {/* Hour grid lines */}
            {hourMarkers.map((marker) => {
              if (marker.percent < 0 || marker.percent > 100) return null;
              return (
                <div
                  className="absolute left-0 right-0 border-t border-muted-foreground/10"
                  key={`grid-${marker.hour}-${marker.percent}`}
                  style={{
                    top: `${marker.percent}%`,
                  }}
                />
              );
            })}

            {/* Half-hour grid lines (lighter) */}
            {hourMarkers.slice(0, -1).map((marker, idx) => {
              if (idx === hourMarkers.length - 2) return null;
              const nextMarker = hourMarkers[idx + 1];
              if (!nextMarker) return null;
              const halfPercent = (marker.percent + nextMarker.percent) / 2;
              if (halfPercent < 0 || halfPercent > 100) return null;
              return (
                <div
                  className="absolute left-0 right-0 border-t border-dashed border-muted-foreground/5"
                  key={`half-grid-${marker.hour}-${nextMarker.hour}`}
                  style={{
                    top: `${halfPercent}%`,
                  }}
                />
              );
            })}

            {/* Activity bars */}
            {timelineActivities.map((timelineActivity) => (
              <ActivityBar
                activity={timelineActivity.activity}
                colorClass={timelineActivity.colorClass}
                colorVar={timelineActivity.colorVar}
                key={timelineActivity.activity.id}
                label={timelineActivity.label}
                laneCount={timelineActivity.laneCount}
                laneIndex={timelineActivity.laneIndex}
                position={timelineActivity.position}
                tooltip={timelineActivity.tooltip}
              />
            ))}

            {/* Selected sleep duration selector */}
            {selectedSleepStart && selectedSleepEnd && (
              <SleepDurationSelector
                endTime={selectedSleepEnd}
                excludeActivityId={excludeActivityId}
                existingActivities={activities}
                onDragStateChange={handleDragStateChange}
                onEndTimeChange={handleSleepEndChange}
                onStartTimeChange={handleSleepStartChange}
                snapIntervalMinutes={5}
                startTime={selectedSleepStart}
                timeFormat={timeFormat}
                timelineContainerRef={timelineContainerRef}
                window={window}
              />
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
