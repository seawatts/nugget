'use client';

/**
 * Reusable time input component
 * Used for selecting start/end times in activity drawers
 */

interface TimeInputProps {
  label: string;
  value: Date;
  onChange: (date: Date) => void;
  disabled?: boolean;
  id?: string;
}

export function TimeInput({
  label,
  value,
  onChange,
  disabled = false,
  id,
}: TimeInputProps) {
  const handleTimeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const [hours, minutes] = e.target.value.split(':').map(Number);
    if (hours !== undefined && minutes !== undefined) {
      const newDate = new Date(value);
      newDate.setHours(hours, minutes);
      onChange(newDate);
    }
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
    </div>
  );
}
