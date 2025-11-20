'use client';

import { Button } from '@nugget/ui/button';
import { Calendar } from '@nugget/ui/calendar';
import { cn } from '@nugget/ui/lib/utils';
import { Popover, PopoverContent, PopoverTrigger } from '@nugget/ui/popover';
import { format } from 'date-fns';
import { Calendar as CalendarIcon } from 'lucide-react';
import { useState } from 'react';
import type { DateRange } from 'react-day-picker';

interface DateRangeFilterProps {
  lastVisitDate: Date | null;
  onRangeChange: (range: { startDate: Date; endDate: Date }) => void;
}

type FilterPreset = 'last-visit' | 'last-7' | 'last-30' | 'custom';

export function DateRangeFilter({
  lastVisitDate,
  onRangeChange,
}: DateRangeFilterProps) {
  const [selectedPreset, setSelectedPreset] = useState<FilterPreset>(
    lastVisitDate ? 'last-visit' : 'last-7',
  );
  const [dateRange, setDateRange] = useState<DateRange | undefined>(() => {
    const endDate = new Date();
    const startDate =
      lastVisitDate || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
    return { from: startDate, to: endDate };
  });

  const handlePresetClick = (preset: FilterPreset) => {
    setSelectedPreset(preset);
    const endDate = new Date();
    let startDate: Date;

    switch (preset) {
      case 'last-visit': {
        if (!lastVisitDate) return;
        startDate = lastVisitDate;
        break;
      }
      case 'last-7': {
        startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'last-30': {
        startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000);
        break;
      }
      case 'custom': {
        // Don't auto-set dates for custom
        return;
      }
    }

    setDateRange({ from: startDate, to: endDate });
    onRangeChange({ endDate, startDate });
  };

  const handleDateRangeSelect = (range: DateRange | undefined) => {
    setDateRange(range);
    if (range?.from && range?.to) {
      setSelectedPreset('custom');
      onRangeChange({ endDate: range.to, startDate: range.from });
    }
  };

  return (
    <div className="space-y-3">
      {/* Quick action buttons */}
      <div className="flex gap-2 overflow-x-auto pb-2 scrollbar-hide">
        {lastVisitDate && (
          <Button
            className={cn(
              'rounded-full whitespace-nowrap',
              selectedPreset !== 'last-visit' && 'bg-transparent',
            )}
            onClick={() => handlePresetClick('last-visit')}
            size="sm"
            variant={selectedPreset === 'last-visit' ? 'default' : 'outline'}
          >
            Since Last Visit
          </Button>
        )}
        <Button
          className={cn(
            'rounded-full whitespace-nowrap',
            selectedPreset !== 'last-7' && 'bg-transparent',
          )}
          onClick={() => handlePresetClick('last-7')}
          size="sm"
          variant={selectedPreset === 'last-7' ? 'default' : 'outline'}
        >
          Last 7 Days
        </Button>
        <Button
          className={cn(
            'rounded-full whitespace-nowrap',
            selectedPreset !== 'last-30' && 'bg-transparent',
          )}
          onClick={() => handlePresetClick('last-30')}
          size="sm"
          variant={selectedPreset === 'last-30' ? 'default' : 'outline'}
        >
          Last 30 Days
        </Button>
        <Popover>
          <PopoverTrigger asChild>
            <Button
              className={cn(
                'rounded-full whitespace-nowrap',
                selectedPreset !== 'custom' && 'bg-transparent',
              )}
              size="sm"
              variant={selectedPreset === 'custom' ? 'default' : 'outline'}
            >
              <CalendarIcon className="mr-2 size-4" />
              {selectedPreset === 'custom' && dateRange?.from && dateRange?.to
                ? `${format(dateRange.from, 'MMM d')} - ${format(dateRange.to, 'MMM d')}`
                : 'Custom Range'}
            </Button>
          </PopoverTrigger>
          <PopoverContent align="start" className="w-auto p-0">
            <Calendar
              defaultMonth={dateRange?.from}
              initialFocus
              mode="range"
              numberOfMonths={2}
              onSelect={handleDateRangeSelect}
              selected={dateRange}
            />
          </PopoverContent>
        </Popover>
      </div>

      {/* Selected range display */}
      {dateRange?.from && dateRange?.to && (
        <p className="text-sm text-muted-foreground">
          Showing data from {format(dateRange.from, 'MMM d, yyyy')} to{' '}
          {format(dateRange.to, 'MMM d, yyyy')}
        </p>
      )}
    </div>
  );
}
