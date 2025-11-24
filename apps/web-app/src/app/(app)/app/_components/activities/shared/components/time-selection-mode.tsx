'use client';

/**
 * Time Selection Mode Toggle
 * Reusable component for switching between Quick Add and Custom Time entry
 */

import { Button } from '@nugget/ui/button';
import { DateTimeRangePicker } from '@nugget/ui/custom/date-time-range-picker';
import { useEffect, useState } from 'react';

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

  // Update mode when startTime changes (e.g., when dialog reopens with different date)
  useEffect(() => {
    setTimeInputMode(startTimeIsToday ? 'now' : 'custom');
  }, [startTimeIsToday]);

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

  return (
    <div className="space-y-6">
      {/* Time Input Mode Toggle - Only show for today's date */}
      {startTimeIsToday && (
        <div className="grid grid-cols-3 gap-3">
          <Button
            className={`h-12 ${
              timeInputMode === 'now'
                ? `${activityColor} ${activityTextColor}`
                : 'bg-transparent'
            }`}
            onClick={() => {
              setTimeInputMode('now');
              setStartTime(new Date());
              setSelectedQuickTime(null);
            }}
            variant={timeInputMode === 'now' ? 'default' : 'outline'}
          >
            Now
          </Button>
          <Button
            className={`h-12 ${
              timeInputMode === 'quick'
                ? `${activityColor} ${activityTextColor}`
                : 'bg-transparent'
            }`}
            onClick={() => setTimeInputMode('quick')}
            variant={timeInputMode === 'quick' ? 'default' : 'outline'}
          >
            Quick Time
          </Button>
          <Button
            className={`h-12 ${
              timeInputMode === 'custom'
                ? `${activityColor} ${activityTextColor}`
                : 'bg-transparent'
            }`}
            onClick={() => setTimeInputMode('custom')}
            variant={timeInputMode === 'custom' ? 'default' : 'outline'}
          >
            Custom Time
          </Button>
        </div>
      )}

      {/* Now Mode - Only show duration options */}
      {timeInputMode === 'now' && showDurationOptions && (
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
      {timeInputMode === 'quick' && (
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
      {timeInputMode === 'custom' && (
        <div className="space-y-3">
          <p className="text-sm font-medium text-muted-foreground">
            {showDurationOptions ? 'Select Time Range' : 'Select Time'}
          </p>
          {showDurationOptions ? (
            <DateTimeRangePicker
              endDate={endTime ?? undefined}
              mode="range"
              setEndDate={setEndTime}
              setStartDate={setStartTime}
              startDate={startTime}
            />
          ) : (
            <DateTimeRangePicker
              mode="single"
              setStartDate={setStartTime}
              startDate={startTime}
            />
          )}
        </div>
      )}
    </div>
  );
}
