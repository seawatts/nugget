'use client';

import { cn } from '@nugget/ui/lib/utils';
import type * as React from 'react';
import { Label } from './label';
import { Switch } from './switch';

interface SettingToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  disabled?: boolean;
  className?: string;
  labelClassName?: string;
  labelAction?: React.ReactNode;
  children?: React.ReactNode;
}

function SettingToggle({
  label,
  description,
  checked,
  onCheckedChange,
  disabled = false,
  className,
  labelClassName,
  labelAction,
  children,
}: SettingToggleProps) {
  const handleClick = () => {
    if (!disabled) {
      onCheckedChange(!checked);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onCheckedChange(!checked);
    }
  };

  return (
    <button
      className={cn(
        'flex items-center justify-between py-4 border-b cursor-pointer active:bg-muted/50 transition-colors rounded-lg -mx-2 px-2 w-full text-left',
        disabled && 'cursor-not-allowed opacity-50',
        className,
      )}
      disabled={disabled}
      onClick={handleClick}
      onKeyDown={handleKeyDown}
      type="button"
    >
      <div>
        {labelAction ? (
          <div className="flex items-center gap-1.5">
            <Label
              className={cn(
                'cursor-pointer',
                disabled && 'cursor-not-allowed',
                labelClassName,
              )}
            >
              {label}
            </Label>
            {labelAction}
          </div>
        ) : (
          <Label
            className={cn(
              'cursor-pointer',
              disabled && 'cursor-not-allowed',
              labelClassName,
            )}
          >
            {label}
          </Label>
        )}
        {description && (
          <p className="text-sm text-muted-foreground">{description}</p>
        )}
        {children}
      </div>
      <Switch
        checked={checked}
        className="scale-110 pointer-events-none"
        disabled={disabled}
        onCheckedChange={onCheckedChange}
      />
    </button>
  );
}

export { SettingToggle, type SettingToggleProps };
