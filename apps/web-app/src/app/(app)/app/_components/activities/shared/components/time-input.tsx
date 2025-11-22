'use client';

import { Button } from '@nugget/ui/button';
import { DatePicker } from '@nugget/ui/custom/date-picker';

/**
 * Reusable date and time input component with quick time selection options
 * Used for selecting start/end dates and times in activity drawers
 */

interface TimeInputProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  id?: string;
  showQuickOptions?: boolean;
}

export function TimeInput({
  label,
  value,
  onChange,
  disabled = false,
  id,
  showQuickOptions = true,
}: TimeInputProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    if (hours !== undefined && minutes !== undefined) {
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
  };

  const handleDateChange = (date: Date | undefined) => {
    if (date) {
      // Preserve the time when date changes
      const newDate = new Date(date);
      newDate.setHours(value.getHours(), value.getMinutes(), 0, 0);
      onChange(newDate);
    }
  };

  const handleQuickTimeSelect = (minutesAgo: number) => {
    const newDate = new Date();
    newDate.setMinutes(newDate.getMinutes() - minutesAgo);
    onChange(newDate);
  };

  return (
    <div className="space-y-2 min-w-0 max-w-full overflow-hidden">
      <label className="text-xs text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <div className="grid grid-cols-1 sm:grid-cols-[1fr_1fr] gap-3 min-w-0 max-w-full overflow-hidden">
        <div className="min-w-0">
          <DatePicker
            date={value}
            disabled={disabled}
            setDate={handleDateChange}
          />
        </div>
        <input
          className="w-full max-w-full min-w-0 px-3 py-2 rounded-md border border-border bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed box-border"
          disabled={disabled}
          id={id}
          onChange={handleTimeChange}
          type="time"
          value={value.toTimeString().slice(0, 5)}
        />
      </div>
      {showQuickOptions && !disabled && (
        <div className="grid grid-cols-3 gap-2 min-w-0 max-w-full">
          <Button
            className="text-xs h-8 min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
            onClick={() => handleQuickTimeSelect(15)}
            type="button"
            variant="outline"
          >
            15 mins ago
          </Button>
          <Button
            className="text-xs h-8 min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
            onClick={() => handleQuickTimeSelect(30)}
            type="button"
            variant="outline"
          >
            30 mins ago
          </Button>
          <Button
            className="text-xs h-8 min-w-0 max-w-full overflow-hidden text-ellipsis whitespace-nowrap"
            onClick={() => handleQuickTimeSelect(60)}
            type="button"
            variant="outline"
          >
            1 hour ago
          </Button>
        </div>
      )}
    </div>
  );
}
