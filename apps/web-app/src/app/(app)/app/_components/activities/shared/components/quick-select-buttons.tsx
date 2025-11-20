'use client';

/**
 * Reusable quick select buttons component
 * Used for selecting preset values (amounts, durations, etc.)
 */

import { Button } from '@nugget/ui/button';

interface QuickSelectButtonsProps<T extends number | string> {
  options: T[];
  selected: T | null;
  onSelect: (value: T) => void;
  unit?: string;
  label?: string;
  disabled?: boolean;
  /** Custom formatter for displaying option values */
  formatValue?: (value: T) => string;
  /** Number of columns in grid */
  columns?: 2 | 3 | 4;
  /** Custom active color class */
  activeColorClass?: string;
}

export function QuickSelectButtons<T extends number | string>({
  options,
  selected,
  onSelect,
  unit,
  label = 'Quick Select',
  disabled = false,
  formatValue,
  columns = 4,
  activeColorClass = 'bg-primary text-primary-foreground',
}: QuickSelectButtonsProps<T>) {
  const gridColsClass = {
    2: 'grid-cols-2',
    3: 'grid-cols-3',
    4: 'grid-cols-4',
  }[columns];

  return (
    <div className="space-y-3">
      <p className="text-sm font-medium text-muted-foreground">{label}</p>
      <div className={`grid ${gridColsClass} gap-2`}>
        {options.map((value) => {
          const isSelected = selected === value;
          const displayValue = formatValue
            ? formatValue(value)
            : `${value}${unit ? ` ${unit}` : ''}`;

          return (
            <Button
              className={`h-12 ${isSelected ? activeColorClass : 'bg-transparent'}`}
              disabled={disabled}
              key={String(value)}
              onClick={(e) => {
                e.preventDefault();
                e.stopPropagation();
                onSelect(value);
              }}
              type="button"
              variant={isSelected ? 'default' : 'outline'}
            >
              {displayValue}
            </Button>
          );
        })}
      </div>
    </div>
  );
}
