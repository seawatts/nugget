'use client';

/**
 * SleepDurationSelector Component
 * Interactive draggable component for selecting sleep duration on the timeline
 * Supports dragging top and bottom handles to adjust start/end times
 */

import type { Activities } from '@nugget/db/schema';
import { cn } from '@nugget/ui/lib/utils';
import { format } from 'date-fns';
import { useCallback, useEffect, useRef, useState } from 'react';
import type { TimelineWindow } from './utils/timeline-calculations';
import {
  checkCollision,
  percentToTime,
  snapToInterval,
  timeToPercent,
} from './utils/timeline-calculations';

interface SleepDurationSelectorProps {
  startTime: Date;
  endTime: Date;
  window: TimelineWindow;
  existingActivities: Array<typeof Activities.$inferSelect>;
  excludeActivityId?: string; // For editing existing activities
  onStartTimeChange: (time: Date) => void;
  onEndTimeChange: (time: Date) => void;
  timeFormat?: '12h' | '24h';
  snapIntervalMinutes?: number; // Default: 5 minutes
  timelineContainerRef?: React.RefObject<HTMLDivElement | null>;
  onDragStateChange?: (isDragging: boolean) => void;
}

type DragHandle = 'top' | 'bottom' | 'body' | null;

export function SleepDurationSelector({
  startTime,
  endTime,
  window,
  existingActivities,
  excludeActivityId,
  onStartTimeChange,
  onEndTimeChange,
  timeFormat = '12h',
  snapIntervalMinutes = 5,
  timelineContainerRef: externalTimelineContainerRef,
  onDragStateChange,
}: SleepDurationSelectorProps) {
  const [dragging, setDragging] = useState<DragHandle>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [isHovered, setIsHovered] = useState(false);
  const bodyDragOffsetPercentRef = useRef(0);

  // Use local state for visual feedback during dragging
  const [dragStartTime, setDragStartTime] = useState<Date | null>(null);
  const [dragEndTime, setDragEndTime] = useState<Date | null>(null);

  // Use the drag state if dragging, otherwise use props
  const displayStartTime =
    dragging && dragStartTime ? dragStartTime : startTime;
  const displayEndTime = dragging && dragEndTime ? dragEndTime : endTime;

  // Calculate positions
  const startPercent = timeToPercent(displayStartTime, window);
  const endPercent = timeToPercent(displayEndTime, window);
  const heightPercent = endPercent - startPercent;

  const getTimelineContainer = useCallback((): HTMLElement | null => {
    if (externalTimelineContainerRef?.current) {
      return externalTimelineContainerRef.current;
    }
    if (containerRef.current) {
      let parent = containerRef.current.parentElement;
      while (parent) {
        if (parent.classList.contains('relative') && parent.style.minHeight) {
          return parent as HTMLElement;
        }
        parent = parent.parentElement;
      }
    }
    return null;
  }, [externalTimelineContainerRef]);

  // Handle pointer down on drag handles
  const handlePointerDown = useCallback(
    (e: React.PointerEvent<HTMLDivElement>, handle: DragHandle) => {
      if (!handle || e.button === 2) return;

      e.preventDefault();
      e.stopPropagation();

      // Initialize drag state with current values
      setDragStartTime(startTime);
      setDragEndTime(endTime);
      setDragging(handle);

      if (handle === 'body') {
        const timelineContainer = getTimelineContainer();
        if (timelineContainer) {
          const rect = timelineContainer.getBoundingClientRect();
          const y = e.clientY - rect.top;
          const percent = Math.max(0, Math.min(100, (y / rect.height) * 100));
          const currentStartPercent = timeToPercent(startTime, window);
          const currentEndPercent = timeToPercent(endTime, window);
          const durationPercent = currentEndPercent - currentStartPercent;
          const offset = percent - currentStartPercent;
          bodyDragOffsetPercentRef.current = Math.max(
            0,
            Math.min(durationPercent, offset),
          );
        }
      }

      // Capture pointer
      (e.target as HTMLElement).setPointerCapture(e.pointerId);
      onDragStateChange?.(true);
    },
    [startTime, endTime, onDragStateChange, getTimelineContainer, window],
  );

  // Handle pointer move
  const handlePointerMove = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return;

      const timelineContainer = getTimelineContainer();
      if (!timelineContainer) return;

      const timelineRect = timelineContainer.getBoundingClientRect();
      const y = e.clientY - timelineRect.top;
      const percent = Math.max(
        0,
        Math.min(100, (y / timelineRect.height) * 100),
      );

      // Get current values from drag state (for visual feedback) or props
      const currentStartTime = dragStartTime ?? startTime;
      const currentEndTime = dragEndTime ?? endTime;
      const currentStartPercent = timeToPercent(currentStartTime, window);
      const currentEndPercent = timeToPercent(currentEndTime, window);

      if (dragging === 'top') {
        // Dragging start time (top handle)
        const newStartPercent = Math.max(
          0,
          Math.min(percent, currentEndPercent - 1),
        );

        // Snap to interval
        const newStartTime = snapToInterval(
          percentToTime(newStartPercent, window),
          snapIntervalMinutes,
        );

        // Check collision with existing activities
        if (
          !checkCollision(
            newStartTime,
            currentEndTime,
            existingActivities,
            window,
            excludeActivityId,
          )
        ) {
          // Update local state for immediate visual feedback
          setDragStartTime(newStartTime);
          // Also update parent in real-time
          onStartTimeChange(newStartTime);
        }
      } else if (dragging === 'bottom') {
        // Dragging end time (bottom handle)
        const newEndPercent = Math.max(
          currentStartPercent + 1,
          Math.min(100, percent),
        );

        // Snap to interval
        const newEndTime = snapToInterval(
          percentToTime(newEndPercent, window),
          snapIntervalMinutes,
        );

        // Check collision with existing activities
        if (
          !checkCollision(
            currentStartTime,
            newEndTime,
            existingActivities,
            window,
            excludeActivityId,
          )
        ) {
          // Update local state for immediate visual feedback
          setDragEndTime(newEndTime);
          // Also update parent in real-time
          onEndTimeChange(newEndTime);
        }
      } else if (dragging === 'body') {
        const durationPercent = currentEndPercent - currentStartPercent;
        const durationMs =
          currentEndTime.getTime() - currentStartTime.getTime();

        let newStartPercent = percent - bodyDragOffsetPercentRef.current;
        newStartPercent = Math.max(
          0,
          Math.min(100 - durationPercent, newStartPercent),
        );
        const newStartTime = snapToInterval(
          percentToTime(newStartPercent, window),
          snapIntervalMinutes,
        );
        const newEndTime = new Date(newStartTime.getTime() + durationMs);

        if (
          !checkCollision(
            newStartTime,
            newEndTime,
            existingActivities,
            window,
            excludeActivityId,
          )
        ) {
          setDragStartTime(newStartTime);
          setDragEndTime(newEndTime);
          onStartTimeChange(newStartTime);
          onEndTimeChange(newEndTime);
        }
      }
    },
    [
      dragging,
      dragStartTime,
      dragEndTime,
      startTime,
      endTime,
      window,
      snapIntervalMinutes,
      existingActivities,
      excludeActivityId,
      getTimelineContainer,
      onStartTimeChange,
      onEndTimeChange,
    ],
  );

  // Handle pointer up
  const handlePointerUp = useCallback(
    (e: PointerEvent) => {
      if (!dragging) return;

      // Reset drag state (parent already updated during dragging)
      setDragging(null);
      setDragStartTime(null);
      setDragEndTime(null);
      onDragStateChange?.(false);

      // Release pointer capture
      if (e.target instanceof HTMLElement) {
        e.target.releasePointerCapture(e.pointerId);
      }
    },
    [dragging, onDragStateChange],
  );

  // Set up global event listeners for dragging
  useEffect(() => {
    if (!dragging) return;

    document.addEventListener('pointermove', handlePointerMove);
    document.addEventListener('pointerup', handlePointerUp);

    return () => {
      document.removeEventListener('pointermove', handlePointerMove);
      document.removeEventListener('pointerup', handlePointerUp);
    };
  }, [dragging, handlePointerMove, handlePointerUp]);

  const timeFormatStr = timeFormat === '24h' ? 'HH:mm' : 'h:mm a';
  const durationMinutes = Math.round(
    (displayEndTime.getTime() - displayStartTime.getTime()) / (1000 * 60),
  );
  const hours = Math.floor(durationMinutes / 60);
  const minutes = durationMinutes % 60;
  const durationLabel = hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;

  return (
    <div
      className="absolute left-0 right-0"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      ref={containerRef}
      style={{
        height: `${heightPercent}%`,
        minHeight: heightPercent < 1 ? '20px' : undefined,
        top: `${startPercent}%`,
        touchAction: 'none',
      }}
    >
      {/* Sleep duration bar */}
      <div
        className={cn(
          'absolute left-1 right-1 rounded-md transition-all',
          'bg-activity-sleep border-2 border-activity-sleep',
          dragging && 'ring-2 ring-activity-sleep ring-offset-1',
          isHovered && 'brightness-110',
        )}
        onPointerDown={(e) => handlePointerDown(e, 'body')}
        style={{
          height: '100%',
        }}
      >
        {/* Duration label in center */}
        {heightPercent > 5 && (
          <div className="absolute inset-0 flex items-center justify-center">
            <span className="text-xs font-semibold text-white drop-shadow-sm">
              {durationLabel}
            </span>
          </div>
        )}

        {/* Time labels at edges */}
        {heightPercent > 8 && (
          <>
            <div className="absolute top-1 left-1">
              <span className="text-[10px] font-medium text-white drop-shadow-sm">
                {format(displayStartTime, timeFormatStr)}
              </span>
            </div>
            <div className="absolute bottom-1 right-1">
              <span className="text-[10px] font-medium text-white drop-shadow-sm">
                {format(displayEndTime, timeFormatStr)}
              </span>
            </div>
          </>
        )}

        {/* Top drag handle */}
        <div
          aria-valuenow={timeToPercent(displayStartTime, window)}
          className={cn(
            'absolute -top-2 left-0 right-0 h-4 cursor-ns-resize touch-none',
            'flex items-center justify-center',
            dragging === 'top' && 'z-20',
          )}
          onPointerDown={(e) => handlePointerDown(e, 'top')}
          role="slider"
          style={{ touchAction: 'none' }}
          tabIndex={0}
        >
          <div className="h-1 w-full bg-activity-sleep rounded-full" />
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-6 h-4 bg-activity-sleep rounded-full flex items-center justify-center shadow-md">
            <div className="w-3 h-0.5 bg-white" />
            <div className="absolute top-0.5 w-3 h-0.5 bg-white" />
            <div className="absolute bottom-0.5 w-3 h-0.5 bg-white" />
          </div>
        </div>

        {/* Bottom drag handle */}
        <div
          aria-valuenow={timeToPercent(displayEndTime, window)}
          className={cn(
            'absolute -bottom-2 left-0 right-0 h-4 cursor-ns-resize touch-none',
            'flex items-center justify-center',
            dragging === 'bottom' && 'z-20',
          )}
          onPointerDown={(e) => handlePointerDown(e, 'bottom')}
          role="slider"
          style={{ touchAction: 'none' }}
          tabIndex={0}
        >
          <div className="h-1 w-full bg-activity-sleep rounded-full" />
          <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-6 h-4 bg-activity-sleep rounded-full flex items-center justify-center shadow-md">
            <div className="w-3 h-0.5 bg-white" />
            <div className="absolute top-0.5 w-3 h-0.5 bg-white" />
            <div className="absolute bottom-0.5 w-3 h-0.5 bg-white" />
          </div>
        </div>
      </div>
    </div>
  );
}
