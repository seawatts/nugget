'use client';

/**
 * Time Selection Mode Toggle
 * Reusable component for switching between Quick Add and Custom Time entry
 */

import { Button } from '@nugget/ui/button';
import { Calendar } from '@nugget/ui/calendar';
import { Input } from '@nugget/ui/input';
import { Label } from '@nugget/ui/label';
import { Popover, PopoverContent, PopoverTrigger } from '@nugget/ui/popover';
import { format } from 'date-fns';
import { useEffect, useMemo, useState } from 'react';

interface QuickTimeOption {
  label: string;
  minutes: number;
}

interface QuickDurationOption {
  label: string;
  seconds: number;
}

interface TimeSelectionModeProps {
  startTime: Date;
  setStartTime: (date: Date) => void;
  endTime: Date | null;
  setEndTime?: (date: Date) => void;
  duration: number;
  setDuration: (duration: number) => void;
  quickTimeOptions?: QuickTimeOption[];
  quickDurationOptions?: QuickDurationOption[];
  timeFormat?: '12h' | '24h';
  showStartTimeOptions?: boolean; // Whether to show "when did it start" options
  showDurationOptions?: boolean; // Whether to show "how long" options
  activityColor?: string; // e.g., 'bg-activity-sleep'
  activityTextColor?: string; // e.g., 'text-activity-sleep-foreground'
  externalMode?: 'now' | 'quick' | 'custom' | null; // External control of mode
  onModeChange?: (mode: 'now' | 'quick' | 'custom') => void; // Callback when mode changes
}

const defaultQuickTimeOptions: QuickTimeOption[] = [
  { label: '15 mins ago', minutes: 15 },
  { label: '30 mins ago', minutes: 30 },
  { label: '1 hour ago', minutes: 60 },
];

const defaultQuickDurationOptions: QuickDurationOption[] = [
  { label: '30 min', seconds: 30 * 60 },
  { label: '1 hour', seconds: 60 * 60 },
  { label: '2 hours', seconds: 120 * 60 },
];

export function TimeSelectionMode({
  startTime,
  setStartTime,
  endTime,
  setEndTime,
  duration,
  setDuration,
  quickTimeOptions = defaultQuickTimeOptions,
  quickDurationOptions = defaultQuickDurationOptions,
  timeFormat: _timeFormat = '12h',
  showStartTimeOptions = true,
  showDurationOptions = true,
  activityColor = 'bg-activity-sleep',
  activityTextColor = 'text-activity-sleep-foreground',
  externalMode,
  onModeChange,
}: TimeSelectionModeProps) {
  // Check if startTime is for today
  const isToday = (date: Date) => {
    const today = new Date();
    return (
      date.getDate() === today.getDate() &&
      date.getMonth() === today.getMonth() &&
      date.getFullYear() === today.getFullYear()
    );
  };

  const startTimeIsToday = isToday(startTime);

  const [timeInputMode, setTimeInputMode] = useState<
    'now' | 'quick' | 'custom'
  >(startTimeIsToday ? 'now' : 'custom');
  const [selectedQuickTime, setSelectedQuickTime] = useState<number | null>(
    null,
  );
  const [activeDatePicker, setActiveDatePicker] = useState<
    'start' | 'end' | null
  >(null);

  // Sync with external mode if provided
  const effectiveMode = externalMode ?? timeInputMode;

  // Update internal mode when external mode changes
  useEffect(() => {
    if (externalMode !== null && externalMode !== undefined) {
      setTimeInputMode(externalMode);
    }
  }, [externalMode]);

  const effectiveEndTime = useMemo(() => {
    if (!setEndTime) return null;
    if (endTime) return endTime;
    return new Date(startTime.getTime() + duration * 1000);
  }, [endTime, setEndTime, startTime, duration]);

  // Update mode when startTime changes (e.g., when dialog reopens with different date)
  // Only update if not externally controlled
  useEffect(() => {
    if (externalMode === null || externalMode === undefined) {
      setTimeInputMode(startTimeIsToday ? 'now' : 'custom');
    }
  }, [startTimeIsToday, externalMode]);

  // Helper to update mode
  const updateMode = (mode: 'now' | 'quick' | 'custom') => {
    setTimeInputMode(mode);
    onModeChange?.(mode);
  };

  // Handle quick time selection
  const handleQuickTimeSelect = (minutes: number) => {
    // Use startTime as the base, not current time
    // This ensures we respect the selected date
    const newStartTime = new Date(startTime);
    newStartTime.setMinutes(newStartTime.getMinutes() - minutes);
    setStartTime(newStartTime);
    setSelectedQuickTime(minutes);
  };

  // Handle quick duration selection
  const handleQuickDurationSelect = (seconds: number) => {
    setDuration(seconds);
    if (setEndTime) {
      const newEndTime = new Date(startTime.getTime() + seconds * 1000);
      setEndTime(newEndTime);
    }
  };

  const syncDurationFromTimes = (nextStart: Date, nextEnd?: Date | null) => {
    if (!showDurationOptions || !nextEnd) return;
    const diffSeconds = Math.max(
      0,
      Math.round((nextEnd.getTime() - nextStart.getTime()) / 1000),
    );
    setDuration(diffSeconds);
  };

  const updateStartTime = (newStart: Date) => {
    setStartTime(newStart);
    if (showDurationOptions && setEndTime) {
      let currentEnd = effectiveEndTime
        ? new Date(effectiveEndTime)
        : new Date(newStart.getTime() + duration * 1000);
      if (currentEnd <= newStart) {
        currentEnd = new Date(newStart.getTime() + 60 * 60 * 1000);
        setEndTime(currentEnd);
      }
      syncDurationFromTimes(newStart, currentEnd);
    }
  };

  const updateEndTime = (newEnd: Date) => {
    if (!setEndTime) return;
    let adjustedEnd = newEnd;
    if (adjustedEnd <= startTime) {
      adjustedEnd = new Date(startTime.getTime() + 60 * 1000);
    }
    setEndTime(adjustedEnd);
    syncDurationFromTimes(startTime, adjustedEnd);
  };

  const handleCustomStartDateSelect = (selectedDate?: Date) => {
    if (!selectedDate) return;
    const newStart = new Date(selectedDate);
    newStart.setHours(startTime.getHours(), startTime.getMinutes(), 0, 0);
    updateStartTime(newStart);
  };

  const handleCustomEndDateSelect = (selectedDate?: Date) => {
    if (!selectedDate || !setEndTime) return;
    const newEnd = new Date(selectedDate);
    const referenceEnd = effectiveEndTime ?? startTime;
    newEnd.setHours(referenceEnd.getHours(), referenceEnd.getMinutes(), 0, 0);
    updateEndTime(newEnd);
  };

  const handleCustomStartTimeChange = (value: string) => {
    const [hoursStr, minutesStr] = value.split(':');
    const hours = Number.parseInt(hoursStr ?? '0', 10);
    const minutes = Number.parseInt(minutesStr ?? '0', 10);
    const newStart = new Date(startTime);
    newStart.setHours(hours, minutes, 0, 0);
    updateStartTime(newStart);
  };

  const handleCustomEndTimeChange = (value: string) => {
    if (!setEndTime) return;
    const [hoursStr, minutesStr] = value.split(':');
    const hours = Number.parseInt(hoursStr ?? '0', 10);
    const minutes = Number.parseInt(minutesStr ?? '0', 10);
    const newEnd = new Date(effectiveEndTime ?? startTime);
    newEnd.setHours(hours, minutes, 0, 0);
    updateEndTime(newEnd);
  };

  const renderInlineDateField = (
    label: string,
    pickerKey: 'start' | 'end',
    selectedDate: Date,
    onSelect: (date?: Date) => void,
    timeValue: string,
    onTimeChange: (value: string) => void,
  ) => (
    <div className="space-y-2">
      <Label className="text-sm font-medium">{label}</Label>
      <div className="flex items-center gap-2">
        <Popover
          onOpenChange={(open) => setActiveDatePicker(open ? pickerKey : null)}
          open={activeDatePicker === pickerKey}
        >
          <PopoverTrigger asChild>
            <button
              className="flex w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-left text-sm font-normal text-foreground shadow-sm transition-colors hover:bg-accent hover:text-accent-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
              type="button"
            >
              <span>{format(selectedDate, 'MMM d, yyyy')}</span>
            </button>
          </PopoverTrigger>
          <PopoverContent align="start" className="p-0">
            <Calendar
              initialFocus
              mode="single"
              onSelect={(date) => {
                onSelect(date);
                if (date) {
                  setActiveDatePicker(null);
                }
              }}
              selected={selectedDate}
            />
          </PopoverContent>
        </Popover>
        <Input
          className="sm:w-[120px]"
          onChange={(e) => onTimeChange(e.target.value)}
          type="time"
          value={timeValue}
        />
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Time Input Mode Toggle */}
      <div className="grid grid-cols-3 gap-3">
        <Button
          className={`h-12 ${
            effectiveMode === 'now'
              ? `${activityColor} ${activityTextColor}`
              : 'bg-transparent'
          }`}
          onClick={() => {
            updateMode('now');
            setStartTime(new Date());
            setSelectedQuickTime(null);
          }}
          variant={effectiveMode === 'now' ? 'default' : 'outline'}
        >
          Now
        </Button>
        <Button
          className={`h-12 ${
            effectiveMode === 'quick'
              ? `${activityColor} ${activityTextColor}`
              : 'bg-transparent'
          }`}
          onClick={() => updateMode('quick')}
          variant={effectiveMode === 'quick' ? 'default' : 'outline'}
        >
          Quick Time
        </Button>
        <Button
          className={`h-12 ${
            effectiveMode === 'custom'
              ? `${activityColor} ${activityTextColor}`
              : 'bg-transparent'
          }`}
          onClick={() => updateMode('custom')}
          variant={effectiveMode === 'custom' ? 'default' : 'outline'}
        >
          Custom Time
        </Button>
      </div>

      {/* Now Mode - Only show duration options */}
      {effectiveMode === 'now' && showDurationOptions && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">How long?</p>
          <div className="grid grid-cols-3 gap-3">
            {quickDurationOptions.map((option) => (
              <Button
                className={`h-12 ${
                  duration === option.seconds
                    ? `${activityColor} ${activityTextColor}`
                    : 'bg-transparent'
                }`}
                key={option.label}
                onClick={() => handleQuickDurationSelect(option.seconds)}
                variant={duration === option.seconds ? 'default' : 'outline'}
              >
                {option.label}
              </Button>
            ))}
          </div>
        </div>
      )}

      {/* Quick Add Mode */}
      {effectiveMode === 'quick' && (
        <>
          {/* Quick Time Selection */}
          {showStartTimeOptions && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                When did it start?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {quickTimeOptions.map((option) => (
                  <Button
                    className={`h-12 ${
                      selectedQuickTime === option.minutes
                        ? `${activityColor} ${activityTextColor}`
                        : 'bg-transparent'
                    }`}
                    key={option.label}
                    onClick={() => handleQuickTimeSelect(option.minutes)}
                    variant={
                      selectedQuickTime === option.minutes
                        ? 'default'
                        : 'outline'
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}

          {/* Quick Duration Selection */}
          {showDurationOptions && (
            <div className="space-y-3">
              <p className="text-sm font-medium text-muted-foreground">
                How long?
              </p>
              <div className="grid grid-cols-3 gap-3">
                {quickDurationOptions.map((option) => (
                  <Button
                    className={`h-12 ${
                      duration === option.seconds
                        ? `${activityColor} ${activityTextColor}`
                        : 'bg-transparent'
                    }`}
                    key={option.label}
                    onClick={() => handleQuickDurationSelect(option.seconds)}
                    variant={
                      duration === option.seconds ? 'default' : 'outline'
                    }
                  >
                    {option.label}
                  </Button>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Custom Time Mode */}
      {effectiveMode === 'custom' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {showDurationOptions ? 'Select Time Range' : 'Select Time'}
          </p>
          {renderInlineDateField(
            'Start',
            'start',
            startTime,
            handleCustomStartDateSelect,
            `${startTime.getHours().toString().padStart(2, '0')}:${startTime
              .getMinutes()
              .toString()
              .padStart(2, '0')}`,
            handleCustomStartTimeChange,
          )}
          {showDurationOptions &&
            effectiveEndTime &&
            setEndTime &&
            renderInlineDateField(
              'End',
              'end',
              effectiveEndTime,
              handleCustomEndDateSelect,
              `${(effectiveEndTime.getHours() || 0).toString().padStart(2, '0')}:${effectiveEndTime
                .getMinutes()
                .toString()
                .padStart(2, '0')}`,
              handleCustomEndTimeChange,
            )}
        </div>
      )}
    </div>
  );
}
