'use client';

import { Button } from '@nugget/ui/button';

/**
 * Reusable time input component with quick time selection options
 * Used for selecting start/end times in activity drawers
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

  const handleQuickTimeSelect = (minutesAgo: number) => {
    const newDate = new Date();
    newDate.setMinutes(newDate.getMinutes() - minutesAgo);
    onChange(newDate);
  };

  return (
    <div className="space-y-2">
      <label className="text-xs text-muted-foreground" htmlFor={id}>
        {label}
      </label>
      <input
        className="w-full px-3 py-2 rounded-md border border-border bg-background text-foreground disabled:opacity-50 disabled:cursor-not-allowed"
        disabled={disabled}
        id={id}
        onChange={handleTimeChange}
        type="time"
        value={value.toTimeString().slice(0, 5)}
      />
      {showQuickOptions && !disabled && (
        <div className="grid grid-cols-3 gap-2">
          <Button
            className="text-xs h-8"
            onClick={() => handleQuickTimeSelect(15)}
            type="button"
            variant="outline"
          >
            15 mins ago
          </Button>
          <Button
            className="text-xs h-8"
            onClick={() => handleQuickTimeSelect(30)}
            type="button"
            variant="outline"
          >
            30 mins ago
          </Button>
          <Button
            className="text-xs h-8"
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
