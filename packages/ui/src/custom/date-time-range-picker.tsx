'use client';

import { format, isSameDay } from 'date-fns';
import { Clock } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/button';
import { Calendar } from '../components/calendar';
import { Drawer, DrawerContent, DrawerTitle } from '../components/drawer';
import { Input } from '../components/input';
import { Label } from '../components/label';
import { Popover, PopoverContent, PopoverTrigger } from '../components/popover';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../components/select';
import { useIsMobile } from '../hooks/use-media-query';
import { cn } from '../lib/utils';

interface DateTimeRangePickerProps {
  startDate: Date;
  endDate?: Date;
  setStartDate: (date: Date) => void;
  setEndDate?: (date: Date) => void;
  mode?: 'single' | 'range';
  className?: string;
}

export function DateTimeRangePicker({
  startDate,
  endDate,
  setStartDate,
  setEndDate,
  mode = 'range',
  className,
}: DateTimeRangePickerProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);
  const [editingField, setEditingField] = useState<'start' | 'end'>('start');

  const effectiveEndDate = endDate || startDate;

  // Format the display text
  const formatDisplayText = () => {
    if (mode === 'single') {
      return format(startDate, 'h:mm a • MMM d');
    }

    const startTimeStr = format(startDate, 'h:mm a');
    const endTimeStr = format(effectiveEndDate, 'h:mm a');

    if (isSameDay(startDate, effectiveEndDate)) {
      // Same day: "10:30 AM - 11:45 AM • Jan 20"
      return `${startTimeStr} - ${endTimeStr} • ${format(startDate, 'MMM d')}`;
    }
    // Different days: "Jan 20 10:30 AM - Jan 21 11:45 AM"
    return `${format(startDate, 'MMM d')} ${startTimeStr} - ${format(effectiveEndDate, 'MMM d')} ${endTimeStr}`;
  };

  // Handle date selection
  const handleDateSelect = (selectedDate?: Date) => {
    if (!selectedDate) return;

    if (editingField === 'start') {
      const newStart = new Date(selectedDate);
      newStart.setHours(startDate.getHours(), startDate.getMinutes(), 0, 0);
      setStartDate(newStart);

      // If new start is after end, adjust end
      if (setEndDate && effectiveEndDate && newStart > effectiveEndDate) {
        const newEnd = new Date(newStart);
        newEnd.setHours(
          effectiveEndDate.getHours(),
          effectiveEndDate.getMinutes(),
          0,
          0,
        );
        setEndDate(newEnd);
      }
    } else if (editingField === 'end' && setEndDate) {
      const newEnd = new Date(selectedDate);
      newEnd.setHours(
        effectiveEndDate.getHours(),
        effectiveEndDate.getMinutes(),
        0,
        0,
      );

      // Validate that end is after start
      if (newEnd < startDate) {
        // If end date is before start date, set to start date
        newEnd.setFullYear(
          startDate.getFullYear(),
          startDate.getMonth(),
          startDate.getDate(),
        );
      }
      setEndDate(newEnd);
    }
  };

  // Handle time change for start
  const handleStartTimeChange = (
    hours: number,
    minutes: number,
    isPM: boolean,
  ) => {
    const actualHours =
      hours === 12 ? (isPM ? 12 : 0) : isPM ? hours + 12 : hours;
    const newStart = new Date(startDate);
    newStart.setHours(actualHours, minutes, 0, 0);
    setStartDate(newStart);

    // If new start is after end, adjust end to be 1 hour after start
    if (setEndDate && effectiveEndDate && newStart >= effectiveEndDate) {
      const newEnd = new Date(newStart);
      newEnd.setHours(newStart.getHours() + 1, newStart.getMinutes(), 0, 0);
      setEndDate(newEnd);
    }
  };

  // Handle time change for end
  const handleEndTimeChange = (
    hours: number,
    minutes: number,
    isPM: boolean,
  ) => {
    if (!setEndDate) return;

    const actualHours =
      hours === 12 ? (isPM ? 12 : 0) : isPM ? hours + 12 : hours;
    const newEnd = new Date(effectiveEndDate);
    newEnd.setHours(actualHours, minutes, 0, 0);

    // Validate that end is after start
    if (newEnd > startDate) {
      setEndDate(newEnd);
    } else {
      // If end would be before start, set it to start + 1 minute
      const adjustedEnd = new Date(startDate);
      adjustedEnd.setMinutes(startDate.getMinutes() + 1);
      setEndDate(adjustedEnd);
    }
  };

  // Handle mobile time input
  const handleMobileStartTimeChange = (timeString: string) => {
    const [hoursStr, minutesStr] = timeString.split(':');
    const newHours = Number.parseInt(hoursStr ?? '12', 10);
    const newMinutes = Number.parseInt(minutesStr ?? '0', 10);

    const newStart = new Date(startDate);
    newStart.setHours(newHours, newMinutes, 0, 0);
    setStartDate(newStart);

    if (setEndDate && effectiveEndDate && newStart >= effectiveEndDate) {
      const newEnd = new Date(newStart);
      newEnd.setHours(newStart.getHours() + 1, newStart.getMinutes(), 0, 0);
      setEndDate(newEnd);
    }
  };

  const handleMobileEndTimeChange = (timeString: string) => {
    if (!setEndDate) return;

    const [hoursStr, minutesStr] = timeString.split(':');
    const newHours = Number.parseInt(hoursStr ?? '12', 10);
    const newMinutes = Number.parseInt(minutesStr ?? '0', 10);

    const newEnd = new Date(effectiveEndDate);
    newEnd.setHours(newHours, newMinutes, 0, 0);

    if (newEnd > startDate) {
      setEndDate(newEnd);
    }
  };

  const renderTimeSelector = (date: Date, isStart: boolean) => {
    const hours = date.getHours();
    const minutes = date.getMinutes();
    const isPM = hours >= 12;
    const displayHours = hours % 12 || 12;

    const mobileTimeValue = `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}`;

    const handleChange = isStart ? handleStartTimeChange : handleEndTimeChange;
    const handleMobileChange = isStart
      ? handleMobileStartTimeChange
      : handleMobileEndTimeChange;

    return (
      <div className="space-y-2">
        <Label className="text-sm font-medium">
          {isStart ? 'Start Time' : 'End Time'}
        </Label>
        {isMobile ? (
          <Input
            className="w-full"
            onChange={(e) => handleMobileChange(e.target.value)}
            type="time"
            value={mobileTimeValue}
          />
        ) : (
          <div className="flex items-center gap-2">
            <Select
              onValueChange={(value) =>
                handleChange(Number.parseInt(value, 10), minutes, isPM)
              }
              value={displayHours.toString()}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => i + 1).map((h) => (
                  <SelectItem key={h} value={h.toString()}>
                    {h}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <span className="text-muted-foreground">:</span>

            <Select
              onValueChange={(value) =>
                handleChange(displayHours, Number.parseInt(value, 10), isPM)
              }
              value={minutes.toString().padStart(2, '0')}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 60 }, (_, i) => i).map((m) => (
                  <SelectItem key={m} value={m.toString().padStart(2, '0')}>
                    {m.toString().padStart(2, '0')}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select
              onValueChange={(value) =>
                handleChange(displayHours, minutes, value === 'PM')
              }
              value={isPM ? 'PM' : 'AM'}
            >
              <SelectTrigger className="w-[70px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="AM">AM</SelectItem>
                <SelectItem value="PM">PM</SelectItem>
              </SelectContent>
            </Select>
          </div>
        )}
      </div>
    );
  };

  // Trigger button (shared between mobile and desktop)
  const triggerButton = (
    <button
      className={cn(
        'flex items-center gap-2 text-sm transition-colors hover:opacity-80',
        className,
      )}
      type="button"
    >
      <Clock className="size-4" />
      <span>{formatDisplayText()}</span>
    </button>
  );

  // Content (shared between mobile and desktop)
  const pickerContent = (
    <>
      {mode === 'range' && (
        <div className="flex gap-2 p-3 border-b border-border">
          <Button
            onClick={() => setEditingField('start')}
            size="sm"
            variant={editingField === 'start' ? 'default' : 'outline'}
          >
            Start
          </Button>
          <Button
            onClick={() => setEditingField('end')}
            size="sm"
            variant={editingField === 'end' ? 'default' : 'outline'}
          >
            End
          </Button>
        </div>
      )}

      <Calendar
        mode="single"
        onSelect={handleDateSelect}
        selected={editingField === 'start' ? startDate : effectiveEndDate}
      />

      <div className="border-t p-3 space-y-3">
        {mode === 'single'
          ? renderTimeSelector(startDate, true)
          : editingField === 'start'
            ? renderTimeSelector(startDate, true)
            : renderTimeSelector(effectiveEndDate, false)}

        <div className="flex gap-2 mt-3">
          <Button
            className="flex-1"
            onClick={() => setIsOpen(false)}
            size="sm"
            variant="outline"
          >
            Cancel
          </Button>
          <Button className="flex-1" onClick={() => setIsOpen(false)} size="sm">
            Done
          </Button>
        </div>
      </div>
    </>
  );

  // Mobile: Use Drawer
  if (isMobile) {
    return (
      <>
        <button onClick={() => setIsOpen(true)} type="button">
          {triggerButton}
        </button>
        <Drawer onOpenChange={setIsOpen} open={isOpen}>
          <DrawerContent className="max-h-[90vh]">
            <DrawerTitle className="sr-only">
              {mode === 'single'
                ? 'Select Date & Time'
                : 'Select Date & Time Range'}
            </DrawerTitle>
            <div className="overflow-y-auto">{pickerContent}</div>
          </DrawerContent>
        </Drawer>
      </>
    );
  }

  // Desktop: Use Popover
  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>{triggerButton}</PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        {pickerContent}
      </PopoverContent>
    </Popover>
  );
}
