'use client';

import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import { Button } from '../components/button';
import { Calendar } from '../components/calendar';
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

interface DateTimePickerProps {
  date?: Date;
  setDate: (date?: Date) => void;
  placeholder?: string;
}

export function DateTimePicker({
  date,
  setDate,
  placeholder = 'Pick a date and time',
}: DateTimePickerProps) {
  const isMobile = useIsMobile();
  const [isOpen, setIsOpen] = useState(false);

  // Extract hours and minutes from date
  const hours = date ? date.getHours() : 12;
  const minutes = date ? date.getMinutes() : 0;
  const isPM = hours >= 12;
  const displayHours = hours % 12 || 12;

  const handleDateSelect = (selectedDate?: Date) => {
    if (selectedDate) {
      // Preserve the time if it exists, or use current hours/minutes
      const newDate = new Date(selectedDate);
      if (date) {
        newDate.setHours(date.getHours(), date.getMinutes(), 0, 0);
      } else {
        newDate.setHours(hours, minutes, 0, 0);
      }
      setDate(newDate);
    } else {
      setDate(undefined);
    }
  };

  const handleTimeChange = (
    newHours: number,
    newMinutes: number,
    newIsPM: boolean,
  ) => {
    const actualHours =
      newHours === 12 ? (newIsPM ? 12 : 0) : newIsPM ? newHours + 12 : newHours;

    if (date) {
      const newDate = new Date(date);
      newDate.setHours(actualHours, newMinutes, 0, 0);
      setDate(newDate);
    } else {
      // If no date selected, use today
      const newDate = new Date();
      newDate.setHours(actualHours, newMinutes, 0, 0);
      setDate(newDate);
    }
  };

  const handleMobileTimeChange = (timeString: string) => {
    const [hoursStr, minutesStr] = timeString.split(':');
    const newHours = Number.parseInt(hoursStr ?? '12', 10);
    const newMinutes = Number.parseInt(minutesStr ?? '0', 10);

    if (date) {
      const newDate = new Date(date);
      newDate.setHours(newHours, newMinutes, 0, 0);
      setDate(newDate);
    } else {
      const newDate = new Date();
      newDate.setHours(newHours, newMinutes, 0, 0);
      setDate(newDate);
    }
  };

  const formatDateTime = (d: Date) => {
    const dateStr = format(d, 'PPP');
    const timeStr = format(d, 'h:mm a');
    return `${dateStr} at ${timeStr}`;
  };

  const mobileTimeValue = date
    ? `${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
    : '';

  return (
    <Popover onOpenChange={setIsOpen} open={isOpen}>
      <PopoverTrigger asChild>
        <Button
          className={cn(
            'w-full justify-start text-left font-normal',
            !date && 'text-muted-foreground',
          )}
          variant="outline"
        >
          <CalendarIcon className="mr-2 size-4" />
          {date ? formatDateTime(date) : <span>{placeholder}</span>}
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" className="w-auto p-0">
        <Calendar mode="single" onSelect={handleDateSelect} selected={date} />

        <div className="border-t p-3">
          <Label className="text-sm font-medium mb-2 block">Time</Label>

          {isMobile ? (
            // Mobile: Use native time input
            <Input
              className="w-full"
              onChange={(e) => handleMobileTimeChange(e.target.value)}
              type="time"
              value={mobileTimeValue}
            />
          ) : (
            // Desktop: Use select dropdowns
            <div className="flex items-center gap-2">
              <Select
                onValueChange={(value) =>
                  handleTimeChange(Number.parseInt(value, 10), minutes, isPM)
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
                  handleTimeChange(
                    displayHours,
                    Number.parseInt(value, 10),
                    isPM,
                  )
                }
                value={minutes.toString().padStart(2, '0')}
              >
                <SelectTrigger className="w-[70px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {['00', '15', '30', '45'].map((m) => (
                    <SelectItem key={m} value={m}>
                      {m}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                onValueChange={(value) =>
                  handleTimeChange(displayHours, minutes, value === 'PM')
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

          <div className="flex gap-2 mt-3">
            <Button
              className="flex-1"
              onClick={() => setIsOpen(false)}
              size="sm"
              variant="outline"
            >
              Cancel
            </Button>
            <Button
              className="flex-1"
              onClick={() => setIsOpen(false)}
              size="sm"
            >
              Done
            </Button>
          </div>
        </div>
      </PopoverContent>
    </Popover>
  );
}
