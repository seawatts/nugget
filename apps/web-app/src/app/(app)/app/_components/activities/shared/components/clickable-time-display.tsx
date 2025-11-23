'use client';

import { Button } from '@nugget/ui/button';
import { Calendar } from '@nugget/ui/calendar';
import { Dialog, DialogContent } from '@nugget/ui/dialog';
import { Drawer, DrawerContent, DrawerTitle } from '@nugget/ui/drawer';
import { useMediaQuery } from '@nugget/ui/hooks/use-media-query';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { cn } from '@nugget/ui/lib/utils';
import { format, formatDistanceToNow } from 'date-fns';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';
import { formatTimeWithPreference } from '~/lib/format-time';

interface ClickableTimeDisplayProps {
  startTime: Date;
  endTime?: Date;
  duration?: number; // in minutes
  onStartTimeChange: (date: Date) => void;
  onEndTimeChange?: (date: Date) => void;
  timeFormat: '12h' | '24h';
  className?: string;
  mode?: 'single' | 'range';
}

/**
 * Formats duration in minutes to a human-readable string
 * @param minutes - Duration in minutes
 * @returns Formatted string like "1h 30m" or "45m"
 */
function formatDuration(minutes: number): string {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
}

/**
 * Clickable time display component that shows relative time with absolute time
 * For activities with durations, shows start time and duration
 * Opens a drawer/dialog to edit the time when clicked
 */
export function ClickableTimeDisplay({
  startTime,
  endTime,
  duration,
  onStartTimeChange,
  onEndTimeChange,
  timeFormat,
  className,
  mode = 'single',
}: ClickableTimeDisplayProps) {
  const [isOpen, setIsOpen] = useState(false);
  const isDesktop = useMediaQuery({ query: '(min-width: 768px)' });

  const effectiveEndTime = endTime || startTime;

  // Format relative time (e.g., "2 hours ago")
  const relativeTime = formatDistanceToNow(startTime, { addSuffix: true });

  // Format absolute time (e.g., "2:30 PM")
  const absoluteTime = formatTimeWithPreference(startTime, timeFormat);

  // Build the display text
  let displayText: string;
  if (mode === 'range' && duration && duration > 0) {
    // For range mode with duration: "2:30 PM (1h 30m)"
    displayText = `${relativeTime} (${absoluteTime} • ${formatDuration(duration)})`;
  } else if (mode === 'single') {
    // For single mode: "2 hours ago (2:30 PM)"
    displayText = `${relativeTime} (${absoluteTime})`;
  } else {
    // Fallback
    displayText = `${relativeTime} (${absoluteTime})`;
  }

  // Handle date selection (single mode)
  const handleDateSelect = (selectedDate?: Date) => {
    if (!selectedDate) return;
    const newStart = new Date(selectedDate);
    newStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    onStartTimeChange(newStart);
  };

  // Handle date range selection (range mode)
  const handleDateRangeSelect = (range?: DateRange) => {
    if (!range || !onEndTimeChange) return;

    if (range.from) {
      const newStart = new Date(range.from);
      newStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
      onStartTimeChange(newStart);
    }

    if (range.to) {
      const newEnd = new Date(range.to);
      newEnd.setHours(
        effectiveEndTime.getHours(),
        effectiveEndTime.getMinutes(),
        0,
        0,
      );
      onEndTimeChange(newEnd);
    }
  };

  // Handle mobile time input
  const handleMobileStartTimeChange = (timeString: string) => {
    const [hoursStr, minutesStr] = timeString.split(':');
    const newHours = Number.parseInt(hoursStr ?? '12', 10);
    const newMinutes = Number.parseInt(minutesStr ?? '0', 10);
    const newStart = new Date(startTime);
    newStart.setHours(newHours, newMinutes, 0, 0);
    onStartTimeChange(newStart);

    if (onEndTimeChange && effectiveEndTime && newStart >= effectiveEndTime) {
      const newEnd = new Date(newStart);
      newEnd.setHours(newStart.getHours() + 1, newStart.getMinutes(), 0, 0);
      onEndTimeChange(newEnd);
    }
  };

  const handleMobileEndTimeChange = (timeString: string) => {
    if (!onEndTimeChange) return;
    const [hoursStr, minutesStr] = timeString.split(':');
    const newHours = Number.parseInt(hoursStr ?? '12', 10);
    const newMinutes = Number.parseInt(minutesStr ?? '0', 10);
    const newEnd = new Date(effectiveEndTime);
    newEnd.setHours(newHours, newMinutes, 0, 0);
    if (newEnd > startTime) {
      onEndTimeChange(newEnd);
    }
  };

  // Quick time presets
  const quickPresets = [
    { label: 'Now', offset: 0 },
    { label: '15m ago', offset: -15 },
    { label: '30m ago', offset: -30 },
    { label: '1h ago', offset: -60 },
    { label: '2h ago', offset: -120 },
  ];

  const handleQuickPreset = (offsetMinutes: number) => {
    const now = new Date();
    const newDate = new Date(now.getTime() + offsetMinutes * 60 * 1000);

    if (mode === 'single') {
      onStartTimeChange(newDate);
    } else if (onEndTimeChange) {
      const currentDuration = effectiveEndTime.getTime() - startTime.getTime();
      onStartTimeChange(newDate);
      const newEnd = new Date(newDate.getTime() + currentDuration);
      onEndTimeChange(newEnd);
    }
  };

  // Time picker content
  const timePickerContent = (
    <>
      {/* Calendar */}
      <div className="flex justify-center w-full p-3">
        {mode === 'range' ? (
          <Calendar
            mode="range"
            onSelect={handleDateRangeSelect}
            selected={{ from: startTime, to: effectiveEndTime }}
          />
        ) : (
          <Calendar
            mode="single"
            onSelect={handleDateSelect}
            selected={startTime}
          />
        )}
      </div>

      <div className="border-t p-3 space-y-4">
        {/* Quick presets */}
        <div className="w-full">
          <p className="text-xs font-medium text-muted-foreground mb-2">
            Quick Select
          </p>
          <div className="grid grid-cols-5 gap-2 w-full">
            {quickPresets.map((preset) => (
              <Button
                className="h-10 text-xs font-medium whitespace-nowrap px-2"
                key={preset.label}
                onClick={() => handleQuickPreset(preset.offset)}
                size="sm"
                type="button"
                variant="outline"
              >
                {preset.label}
              </Button>
            ))}
          </div>
        </div>

        {mode === 'single' ? (
          <div className="space-y-2">
            <Label className="text-sm font-medium">Date & Time</Label>
            <div className="flex gap-2">
              <Input
                className="flex-1"
                readOnly
                value={format(startTime, 'MMM d, yyyy')}
              />
              <Input
                className="w-[120px]"
                onChange={(e) => handleMobileStartTimeChange(e.target.value)}
                type="time"
                value={`${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`}
              />
            </div>
          </div>
        ) : (
          <>
            {/* Start section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">Start</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  readOnly
                  value={format(startTime, 'MMM d, yyyy')}
                />
                <Input
                  className="w-[120px]"
                  onChange={(e) => handleMobileStartTimeChange(e.target.value)}
                  type="time"
                  value={`${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`}
                />
              </div>
            </div>

            {/* End section */}
            <div className="space-y-2">
              <Label className="text-sm font-medium">End</Label>
              <div className="flex gap-2">
                <Input
                  className="flex-1"
                  readOnly
                  value={format(effectiveEndTime, 'MMM d, yyyy')}
                />
                <Input
                  className="w-[120px]"
                  onChange={(e) => handleMobileEndTimeChange(e.target.value)}
                  type="time"
                  value={`${effectiveEndTime.getHours().toString().padStart(2, '0')}:${effectiveEndTime.getMinutes().toString().padStart(2, '0')}`}
                />
              </div>
            </div>
          </>
        )}

        <div className="flex gap-2 pt-2">
          <Button
            className="flex-1"
            onClick={() => setIsOpen(false)}
            size="sm"
            type="button"
            variant="outline"
          >
            Cancel
          </Button>
          <Button
            className="flex-1"
            onClick={() => setIsOpen(false)}
            size="sm"
            type="button"
          >
            Done
          </Button>
        </div>
      </div>
    </>
  );

  return (
    <>
      <button
        className={cn(
          'flex items-center gap-2 text-sm opacity-90 hover:opacity-100 transition-opacity',
          'cursor-pointer group',
          className,
        )}
        onClick={() => setIsOpen(true)}
        type="button"
      >
        <Clock className="size-4" />
        <span className="underline decoration-dotted underline-offset-2">
          {displayText}
        </span>
      </button>

      {isDesktop ? (
        <Dialog onOpenChange={setIsOpen} open={isOpen}>
          <DialogContent className="sm:max-w-[425px]">
            <div className="space-y-4">
              <h4 className="font-semibold text-lg">Edit Time</h4>
              {timePickerContent}
            </div>
          </DialogContent>
        </Dialog>
      ) : (
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerContent className="max-h-[90vh] w-full">
            <DrawerTitle className="sr-only">
              {mode === 'single'
                ? 'Select Date & Time'
                : 'Select Date & Time Range'}
            </DrawerTitle>
            <div className="overflow-y-auto w-full">{timePickerContent}</div>
          </DrawerContent>
        </Drawer>
      )}
    </>
  );
}
