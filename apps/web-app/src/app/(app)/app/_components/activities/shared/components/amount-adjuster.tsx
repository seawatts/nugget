'use client';

/**
 * Reusable amount adjuster component with plus/minus buttons
 * Used for adjusting numeric values (volume, temperature, etc.)
 */

import { Button } from '@nugget/ui/button';
import { Minus, Plus } from 'lucide-react';

interface AmountAdjusterProps {
  value: number;
  onChange: (value: number) => void;
  step?: number;
  min?: number;
  max?: number;
  unit?: string;
  disabled?: boolean;
  /** Size variant for the component */
  size?: 'sm' | 'md' | 'lg';
}

export function AmountAdjuster({
  value,
  onChange,
  step = 1,
  min = 0,
  max = Number.POSITIVE_INFINITY,
  unit,
  disabled = false,
  size = 'lg',
}: AmountAdjusterProps) {
  const handleDecrement = () => {
    const newValue = Math.max(min, value - step);
    onChange(newValue);
  };

  const handleIncrement = () => {
    const newValue = Math.min(max, value + step);
    onChange(newValue);
  };

  const sizeClasses = {
    lg: {
      button: 'h-14 w-14',
      container: 'p-8',
      icon: 'h-6 w-6',
      value: 'text-6xl',
    },
    md: {
      button: 'h-10 w-10',
      container: 'p-6',
      icon: 'h-4 w-4',
      value: 'text-3xl',
    },
    sm: {
      button: 'h-8 w-8',
      container: 'p-4',
      icon: 'h-3 w-3',
      value: 'text-2xl',
    },
  }[size];

  return (
    <div className={`bg-card rounded-2xl ${sizeClasses.container}`}>
      <div className="flex items-center justify-center gap-6">
        <Button
          className={`${sizeClasses.button} rounded-full bg-transparent`}
          disabled={disabled || value <= min}
          onClick={handleDecrement}
          size="icon"
          variant="outline"
        >
          <Minus className={sizeClasses.icon} />
        </Button>
        <div className="text-center">
          <div className={`${sizeClasses.value} font-bold text-foreground`}>
            {value}
          </div>
          {unit && <p className="text-muted-foreground mt-1">{unit}</p>}
        </div>
        <Button
          className={`${sizeClasses.button} rounded-full bg-transparent`}
          disabled={disabled || value >= max}
          onClick={handleIncrement}
          size="icon"
          variant="outline"
        >
          <Plus className={sizeClasses.icon} />
        </Button>
      </div>
    </div>
  );
}
